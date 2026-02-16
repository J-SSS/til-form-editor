# Project Rules (til-form-editor)

## Git Commit Rule (Project-only)
- Every completed Codex task must end with a git commit in this repository.
- Do not batch unrelated tasks into one commit.
- Use one commit per user request unless the user explicitly asks otherwise.
- Do not ask the user for confirmation before running `git add` or `git commit` for normal task completion.
- Commit message format:
  - `[codex] <short summary>`

## Safety
- Never use destructive git commands (`reset --hard`, force-push) unless explicitly requested.
- If a commit cannot be created (conflict/lock/error), report the reason and stop before further edits.
