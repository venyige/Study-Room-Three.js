#!/usr/bin/env python3
"""PreToolUse hook: enforce ISSUE__slug branch naming on branch creation.

Reads the Claude Code PreToolUse JSON payload on stdin and inspects branch
names about to be created via:

  * Bash:          git checkout -b/-B, git switch -c/-C, git branch <name>,
                   git branch -m/-M/-c/-C <new>, git worktree add ... -b/-B
  * EnterWorktree: any *creation* call is blocked (see below).

For Bash it blocks (exit 2) ONLY on confident, structural violations of the
branch-naming-convention. Anything subjective (vagueness, whether an
issue number is present, exact word count within the cap) is allowed. Whenever a
branch name cannot be confidently extracted, the hook fails OPEN (exit 0) so it
never blocks legitimate git usage.

EnterWorktree is the one deliberate fail-CLOSED case: the native tool always
names the git branch 'worktree-<name>' (the directory is named correctly, the
branch is not), so it can never produce a convention-compliant branch. The hook
therefore blocks any EnterWorktree call that would *create* a worktree (both the
'name' form and the no-arg auto-'worktree-N' form) and steers the agent to
`git worktree add -b ISSUE__slug` instead. Entering an existing worktree via the
'path' parameter creates no branch and is allowed.
"""

import json
import re
import shlex
import sys

SLUG_WORD_CAP = 4


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)  # unparseable input -> fail open

    tool = payload.get("tool_name", "")
    tool_input = payload.get("tool_input") or {}

    if tool == "Bash":
        names = extract_from_command(tool_input.get("command", "") or "")
    elif tool == "EnterWorktree":
        # Entering an existing worktree (path) creates no branch -> allow.
        # Any creation (name= or no-arg auto-'worktree-N') yields a
        # 'worktree-'-prefixed branch -> block and steer to git worktree add.
        if not tool_input.get("path"):
            block_enterworktree()
        names = []
    else:
        names = []

    for name in names:
        problem = validate(name)
        if problem:
            block(name, problem)

    sys.exit(0)


def block_enterworktree():
    msg = (
        "EnterWorktree names the git branch 'worktree-<name>', which always "
        "violates the branch-naming-convention (the worktree directory "
        "is named correctly, but the branch is not). Do not create worktrees with "
        "this tool.\n"
        "Create the branch yourself, then enter the worktree by path:\n"
        "  git worktree add -b ISSUE__slug .claude/worktrees/ISSUE__slug\n"
        '  EnterWorktree(path=".claude/worktrees/ISSUE__slug")\n'
        "Entering an existing worktree via 'path' is allowed."
    )
    print(msg, file=sys.stderr)
    sys.exit(2)


def block(name, problem):
    # Only offer a suggestion when it is itself compliant; for cases like a
    # 'worktree'-prefixed name there is no meaningful auto-fix.
    suggestion = suggest(name)
    suggestion_line = ""
    if suggestion and suggestion != name and validate(suggestion) is None:
        suggestion_line = f"Suggested name: {suggestion}\n"
    msg = (
        f"Branch name '{name}' violates the branch-naming-convention: "
        f"{problem}.\n"
        f"Required format: ISSUE__short_slug -- the slug is lowercase ASCII, "
        f"underscore-separated, at most {SLUG_WORD_CAP} words; '__' (two "
        f"underscores) separates the numeric issue id from the slug. Omitting "
        f"the issue number is allowed for spikes (e.g. 'excel_export_hotfix').\n"
        f"{suggestion_line}"
        f"Re-run the command with a corrected branch name."
    )
    print(msg, file=sys.stderr)
    sys.exit(2)


# --- command parsing -------------------------------------------------------


def extract_from_command(command):
    names = []
    # Split into simple commands on shell control operators, then tokenize each.
    for part in re.split(r"&&|\|\||\||;|\n", command):
        try:
            tokens = shlex.split(part)
        except ValueError:
            continue  # unbalanced quotes -> skip this fragment (fail open)
        names.extend(extract_from_tokens(tokens))
    return names


def extract_from_tokens(tokens):
    i = 0
    # Skip leading env assignments and wrappers (sudo/env/command).
    while i < len(tokens) and (
        "=" in tokens[i] or tokens[i] in ("sudo", "env", "command")
    ):
        i += 1
    if i >= len(tokens) or tokens[i] != "git":
        return []

    sub, rest = parse_git_subcommand(tokens[i + 1 :])
    if sub == "checkout":
        return branch_after_flag(rest, {"-b", "-B"})
    if sub == "switch":
        return branch_after_flag(rest, {"-c", "-C"})
    if sub == "branch":
        return branch_create_name(rest)
    if sub == "worktree":
        return worktree_branch(rest)
    return []


def parse_git_subcommand(args):
    """Skip git's global options and return (subcommand, remaining_args)."""
    value_opts = {"-C", "--git-dir", "--work-tree", "--namespace", "-c"}
    i = 0
    while i < len(args):
        a = args[i]
        if a in value_opts:
            i += 2
            continue
        if a.startswith("-"):
            i += 1
            continue
        return a, args[i + 1 :]
    return None, []


def branch_after_flag(rest, flags):
    for i, tok in enumerate(rest):
        if tok in flags and i + 1 < len(rest) and not rest[i + 1].startswith("-"):
            return [rest[i + 1]]
    return []


def branch_create_name(rest):
    delete_flags = {"-d", "-D", "--delete"}
    rename_flags = {"-m", "-M", "--move", "-c", "-C", "--copy"}
    # Flags that may accompany creating a branch. Any other flag (--list,
    # --contains, -u, -v, ...) makes this a query or an upstream change whose
    # positionals are patterns or commits, not a new name -> fail open.
    create_flags = {"-f", "--force", "-t", "--track", "--no-track",
                    "-q", "--quiet", "--create-reflog", "--no-create-reflog"}
    is_delete = is_rename = False
    positionals = []
    for a in rest:
        if a in delete_flags:
            is_delete = True
        elif a in rename_flags:
            is_rename = True
        elif a.startswith("--track="):
            continue
        elif a.startswith("-"):
            if a not in create_flags:
                return []
        else:
            positionals.append(a)
    if is_delete or not positionals:
        return []
    # rename/copy: the new name is the last positional; create: the first.
    return [positionals[-1] if is_rename else positionals[0]]


def worktree_branch(rest):
    if "add" not in rest:
        return []
    after = rest[rest.index("add") + 1 :]
    return branch_after_flag(after, {"-b", "-B"})


# --- validation ------------------------------------------------------------


def validate(name):
    if re.match(r"^worktree", name, re.IGNORECASE):
        return (
            "starts with 'worktree'; branch names must follow the "
            "ISSUE__slug convention, not be named after a worktree"
        )
    if name != name.lower():
        return "contains uppercase letters (must be lowercase ASCII)"
    if re.search(r"\s", name):
        return "contains whitespace"
    if "-" in name:
        return "uses hyphens; the slug must use single underscores ('_') and the issue separator is '__'"
    if re.match(r"^(#|issue[-_]?|ticket[-_]?|gh[-_]?)\d", name):
        return "puts a prefix on the issue number; use the bare numeric id (e.g. '142__', not 'issue-142__')"
    if re.search(r"[^a-z0-9_]", name):
        return "contains characters outside [a-z0-9_]"

    sep_problem = check_issue_separator(name)
    if sep_problem:
        return sep_problem

    slug = slug_part(name)
    if slug:
        words = [w for w in slug.split("_") if w]
        if len(words) > SLUG_WORD_CAP:
            return f"slug has {len(words)} words; the hard cap is {SLUG_WORD_CAP}"
    return None


def check_issue_separator(name):
    """Flag a leading numeric issue id joined to the slug by a single '_'.

    Only fires when the leading underscore-separated segment is FULLY numeric,
    so spikes like '3d_render_test' (leading '3d' is not a pure number) pass.
    """
    first = name.split("_", 1)[0]
    if not first.isdigit():
        return None
    run = re.match(r"^\d+(_\d+)*", name).group(0)
    remainder = name[len(run) :]
    if remainder == "" or remainder.startswith("__"):
        return None  # bare issue id, or a proper '__' separator
    if remainder.startswith("_"):
        return (
            "looks like an issue number joined to the slug by a single '_'; "
            f"use '__' between the issue number and the slug (e.g. '{run}__{remainder[1:]}')"
        )
    return None


def slug_part(name):
    m = re.match(r"^\d+(_\d+)*__", name)
    if m:
        return name[m.end() :]
    if re.fullmatch(r"\d+(_\d+)*", name):
        return ""  # bare issue id, no slug to count
    return name


# --- suggestion (advisory only) -------------------------------------------


def suggest(name):
    s = re.sub(r"[^a-z0-9_]+", "_", name.strip().lower().replace("-", "_"))
    m = re.match(r"^(\d+(?:_\d+)*)_+([a-z0-9].*)$", s)
    if m:
        prefix, sep, slug = m.group(1), "__", m.group(2)
    elif re.fullmatch(r"\d+(?:_\d+)*_*", s):
        return s.strip("_")  # bare issue id
    else:
        prefix, sep, slug = "", "", s
    words = [w for w in re.sub(r"_+", "_", slug).strip("_").split("_") if w]
    slug = "_".join(words[:SLUG_WORD_CAP])
    return f"{prefix}{sep}{slug}" if slug else prefix


if __name__ == "__main__":
    main()
