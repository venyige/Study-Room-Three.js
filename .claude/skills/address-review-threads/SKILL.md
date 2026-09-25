---
name: address-review-threads
description: >-
  Works through the unresolved review threads on a GitHub pull request in this
  repo: fixes on the PR branch, replies in each thread, and resolves it. Use
  when asked to address / fix / answer / resolve review comments or threads
  on a PR (GitLab: "address the MR discussions").
---

# Addressing review threads

Repo `venyige/Study-Room-Three.js`. Replace `N` with the PR number.

## 1. List the unresolved threads

REST has no thread or resolved state, so use GraphQL:

```bash
gh api graphql -F n=N -f query='
query($n:Int!){ repository(owner:"venyige", name:"Study-Room-Three.js"){
  pullRequest(number:$n){ headRefName reviewThreads(first:100){ nodes{
    id isResolved isOutdated path line
    comments(first:20){ nodes{ databaseId author{login} body url } } } } } } }' \
  --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved|not)'
```

Keep each thread's `id` (to resolve it) and its first comment's `databaseId`
(to reply to it).

## 2. Fix, on the PR branch

- Work on the PR's `headRefName`. Never on `master`, and never force-push.
- One commit per finding (or per closely related group). The subject ends
  with the issue tag, e.g. `Stop the drag when the pointer leaves (#1)`.
- Stage named paths only.
- Run `npm test` before pushing. For a rendering change, look at
  `test-results/smoke.png` (see `.claude/rules/verification.md`).
- If you disagree with a finding, do not change the code. Explain why in the
  thread and **leave it unresolved** for the user.
- Leave `[blocking]` threads you did not fully fix unresolved too.

## 3. Reply and resolve

```bash
# reply in the thread (REST, with the first comment's databaseId)
gh api repos/venyige/Study-Room-Three.js/pulls/N/comments/<databaseId>/replies \
  -f body="Fixed in <commit sha>: <one line on what changed>."

# resolve (GraphQL, with the thread id)
gh api graphql -f id=<thread id> -f query='
mutation($id:ID!){ resolveReviewThread(input:{threadId:$id}){ thread{ isResolved } } }'
```

Order: push → wait for CI (`gh pr checks N --watch`) → reply with the commit
link → resolve. A thread is only resolved once its fix is on GitHub and CI
passes.

## 4. Report

A table in chat: thread · what was done (fixed / declined / needs the user)
· commit. Plus the CI result. Update the PR description's Verification list
if the fixes changed what was verified.
