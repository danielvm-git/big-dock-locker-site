# Workflow: Solo Git (local squash land)

This repository follows the bigpowers `solo-git` integration mode.

## Integrate Settings

- **Mode:** `solo-local`
- **Ship Script:** `bash scripts/land-branch.sh <branch> "<message>"`
- **Branch Protection:** `main` is guarded; all feature development happens on isolated worktrees/branches.
- **Verification Gate:** Preflight (`npm run preflight`) must pass 100% green before landing.

## Day-to-Day Flow

1. On `main`: run `survey-context` and planning skills.
2. Branch: run `kickoff-branch` to create an isolated feature branch and worktree.
3. Feature work: execute `develop-tdd` with failing test (RED) first.
4. Verification: run `verify-work` and `audit-code`.
5. Ship: run `commit-message` and land via `scripts/land-branch.sh` to update `main`.
