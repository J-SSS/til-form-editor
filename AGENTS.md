# Project Rules (til-form-editor)

## Git Commit Rule (Project-only)
- Do not create a git commit unless the user explicitly requests a commit.
- Do not batch unrelated tasks into one commit.
- Use one commit per user request unless the user explicitly asks otherwise.
- When a commit is explicitly requested, do not ask for confirmation before running `git add` or `git commit`.
- Commit message format:
  - `[codex] <short summary>`

## Safety
- Never use destructive git commands (`reset --hard`, force-push) unless explicitly requested.
- If a commit cannot be created (conflict/lock/error), report the reason and stop before further edits.
