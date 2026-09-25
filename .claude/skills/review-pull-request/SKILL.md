---
name: review-pull-request
description: >-
  Reviews a GitHub pull request in this repo and posts the findings as inline
  review threads (GitHub's equivalent of GitLab MR discussion threads). Use
  when asked to review a PR / pull request / MR, "post findings as review
  threads", or "review #N". Read-only on the code: it never pushes, edits,
  approves or merges.
---

# Reviewing a pull request

The user usually gives only one line, e.g. *"Review pull request #2 … and post
your findings as review threads on the PR."* Everything else is here. Replace
`N` with the PR number.

Repo: `venyige/Study-Room-Three.js`, base branch `master`.

## Hard limits

- **Do not** push, commit, edit tracked files, approve, merge, or resolve
  threads. The review is the only output. Fixing is a separate step
  (`address-review-threads` skill), done when the user asks.
- The review is posted **as the PR author** (the `gh` login is the repo
  owner). GitHub rejects `APPROVE` and `REQUEST_CHANGES` on your own PR, so
  the review event is always **`COMMENT`**. Severity goes in the comment text.

## 1. Gather context

```bash
gh pr view N --json number,title,body,headRefName,headRefOid,baseRefName,files,commits
gh issue view <issue from "Closes #…">
gh pr diff N
gh api repos/venyige/Study-Room-Three.js/pulls/N/comments --jq '.[] | {path, line, body: .body[0:80]}'
```

- Read `CLAUDE.md` and every file in `.claude/rules/`. They are the standard
  the PR is reviewed against.
- **Existing threads**: if earlier reviews exist, do not repeat a finding that
  is already raised. Mention it in the summary instead.
- Check out the PR head so you can run it. If the working tree is not clean or
  is on another branch, use a separate worktree instead of switching:
  ```bash
  git fetch origin
  git worktree add --detach .claude/worktrees/review_prN origin/<headRefName>
  ```
  (`.claude/worktrees/` is gitignored. `--detach` creates no branch.) Remove it
  when done: `git worktree remove .claude/worktrees/review_prN`.

## 2. Review against these points

1. **Behaviour vs `master`.** The PR must not change how the demo looks or
   behaves unless its description says so. Compare with the originals, e.g.
   `git show master:js/scene_logic.js`. Check the render order, visibility,
   defaults, GUI ranges, camera maths and interaction speeds.
2. **Render-pass invariants and the r74 API.** Everything in
   `.claude/rules/threejs-r74.md`. Confirm r74 API use against
   `vendor/three.min.js` itself, not against modern three.js docs (e.g.
   `node -e` + `indexOf` on the minified source).
3. **Correctness of new code**: races (async model loading vs the render
   loop), event handling (pointer capture, pinch, wheel), leaks, per-frame
   allocations.
4. **CI / GitHub config** (`.github/`): job logic, `permissions`, whether the
   deploy job can work with the repo's current Pages setting
   (`gh api repos/venyige/Study-Room-Three.js/pages -q .build_type`), and
   whether `npm test` and `ci.yml` still run the same checks
   (`.claude/rules/verification.md`).
5. **Docs**: README, `CLAUDE.md` and `.claude/` accurate against the code.
   Commands shown must work; file paths must exist.
6. **Workflow conventions** (`.claude/rules/git-workflow.md`): branch name,
   `(#N)` commit subjects, `Closes #N`, no stray files (`git diff --stat
   master...HEAD`).

## 3. Verify before posting

Every finding must be backed by evidence you produced: a command output, a
reproduction, a quoted line of the r74 source, or a failing check.

```bash
npm ci && npx playwright install chromium   # once per worktree
npm test                                     # must match CI
```

For a rendering finding, look at `test-results/smoke.png`. For behaviour, write
a throwaway Playwright script **outside the repo** (in the scratchpad).
**Drop anything you cannot substantiate**, or mark it `[question]`.

## 4. Post one review with inline threads

Each inline comment becomes its own resolvable conversation thread. Write the
payload to a file **outside the repo** (`SCRATCH=$(mktemp -d)`, or the session
scratchpad) and post it in one call:

```json
{
  "commit_id": "<headRefOid>",
  "event": "COMMENT",
  "body": "Review summary … plus findings not tied to a diff line.",
  "comments": [
    { "path": "src/interaction.js", "line": 154, "side": "RIGHT",
      "body": "**[should-fix]** …" },
    { "path": "src/diamond.js", "start_line": 100, "line": 104, "side": "RIGHT",
      "start_side": "RIGHT", "body": "**[nit]** …\n\n```suggestion\n…\n```" }
  ]
}
```

```bash
gh api repos/venyige/Study-Room-Three.js/pulls/N/reviews --method POST --input "$SCRATCH/review.json"
```

### Anchoring rules (a wrong anchor fails the whole call with HTTP 422)

- `line` is the line number **in the new file** (`side: RIGHT`), and it must lie
  **inside a diff hunk** of that file. Check with `gh pr diff N`.
- For a removed line, use `side: LEFT` and the old file's line number.
- Pure renames (`vendor/`, `assets/`) have no hunks, so no line can be
  commented. Put those findings in the review `body`.
- A `suggestion` block replaces exactly the lines `start_line`…`line`, so
  reproduce the indentation.
- On a 422, fix the anchor. Do not fall back to posting general comments.

### Comment format

~~~markdown
**[blocking|should-fix|nit|question]** One-sentence statement of the problem.

**Scenario:** concrete input/state → wrong result (what you ran and saw).

**Proposal:** the fix, or a ```suggestion block if it is a few lines.
~~~

- **blocking**: breaks the demo or CI, loses behaviour, or a security issue.
- **should-fix**: a real defect or divergence from the rules; fix before merge.
- **nit**: style or wording; optional.
- **question**: you could not verify it; ask.

One finding per thread. Rank the most severe first. English only.

## 5. Confirm and report

```bash
gh api repos/venyige/Study-Room-Three.js/pulls/N/comments \
  --jq '.[] | [.path, (.line|tostring), .html_url] | @tsv'
```

Then reply in chat with a table (severity · file:line · one-line summary ·
thread link), the review link, and what you verified vs. could not verify
(e.g. real-device touch). If there are no findings, still post a `COMMENT`
review saying what was checked.
