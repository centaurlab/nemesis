# Deterministic demo

`template/` contains ordinary files, never a nested `.git`. `npm run demo:reset` copies the base and candidate layers into the ignored `demo/.workdir/repo`, initializes Git, and creates real base and candidate commits. Verification worktrees live under `demo/.workdir/verifications` and are removed after use.
