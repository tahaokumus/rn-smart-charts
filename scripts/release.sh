#!/usr/bin/env bash
# Release rn-smart-charts to npm.
#
# Usage:
#   scripts/release.sh <version>           # interactive OTP prompt
#   scripts/release.sh <version> <otp>     # non-interactive (email/TOTP code)
#
# Example:
#   scripts/release.sh 0.4.1 123456
#
# Preconditions:
#   - You are on the branch you intend to publish from (usually `main`).
#   - Working tree is clean OR contains only the changes you want shipped.
#   - You are logged in to npm (`npm whoami` returns your handle).
#   - 2FA: if your account is in auth-and-writes mode, npm will email you a
#     fresh OTP when this script tries to publish — pass it as the 2nd arg
#     or paste it at the prompt.

set -euo pipefail

VERSION="${1:-}"
OTP="${2:-}"

if [[ -z "$VERSION" ]]; then
  echo "Usage: $0 <version> [otp]" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG_DIR="$REPO_ROOT/packages/rn-smart-charts"

cd "$REPO_ROOT"

# 1. Sanity: must be logged in.
npm whoami >/dev/null

# 2. Bump version in package.json.
node -e "
  const fs = require('fs');
  const p = '$PKG_DIR/package.json';
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  j.version = '$VERSION';
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
"

# 3. Tests + typecheck must pass before we tag anything.
( cd "$PKG_DIR" && pnpm test && pnpm typecheck )

# 4. Commit version bump (only if there's something to commit).
if ! git diff --quiet -- "$PKG_DIR/package.json"; then
  git add "$PKG_DIR/package.json"
  git commit -m "chore(release): v$VERSION"
fi

# 5. Tag.
git tag -a "v$VERSION" -m "v$VERSION"

# 6. Build with bob.
( cd "$PKG_DIR" && pnpm build )

# 7. Publish.
PUBLISH_ARGS=()
if [[ -n "$OTP" ]]; then
  PUBLISH_ARGS+=(--otp="$OTP")
fi
( cd "$PKG_DIR" && npm publish "${PUBLISH_ARGS[@]}" )

# 8. Push commit + tag to origin.
git push origin HEAD
git push origin "v$VERSION"

echo "Released rn-smart-charts@$VERSION"
