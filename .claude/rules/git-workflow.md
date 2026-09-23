# Git workflow

The repository is on GitHub (`venyige/Study-Room-Three.js`). The workflow is
the same as the team's GitLab projects, with GitHub's names: issue → branch →
pull request (= merge request) → review → merge.

- **Never commit or push to `master`.** Every change goes through a branch
  and a pull request, however small. `master` is what GitHub Pages serves.
- **Open the issue first.** Its number names the branch and tags the commits.
  Use a template from `.github/ISSUE_TEMPLATE/`.
- **Branch names are `ISSUE__short_slug`**: lowercase, underscores, at most
  four words, and two underscores after the number (`7__zoom_limits`). A
  `PreToolUse` hook (`.claude/hooks/check-branch-name.py`) rejects malformed
  names.
- **Commit subjects end with the issue reference**, e.g.
  `Clamp the wheel zoom (#7)`. Imperative mood, under ~70 characters.
- **Stage named paths.** Never `git add -A` / `git add .`: the working tree
  may hold screenshots, `test-results/` or scratch files.
- **Pull request**: fill in `.github/pull_request_template.md` and start the
  body with `Closes #N`. Keep the title under ~70 characters. Squash-merge,
  then delete the branch.
- With the GitHub CLI (`7` stands for the issue number):
  ```bash
  gh issue create --title "…" --body-file issue.md --label chore
  git switch -c 7__zoom_limits
  git push -u origin 7__zoom_limits
  gh pr create --base master --title "…" --body-file pr.md --assignee @me
  ```
  Without `gh` or a token, push the branch over SSH and give the user the
  pre-filled `https://github.com/venyige/Study-Room-Three.js/compare/master...BRANCH?expand=1`
  link. Never paste a token into a command.
- **No force-push** to a branch under review unless the user asks.
