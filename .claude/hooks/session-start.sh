#!/bin/bash
set -uo pipefail

# Only needed for Claude Code on the web / remote sessions.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install the agent-browser CLI globally if it's not already on PATH.
if ! command -v agent-browser >/dev/null 2>&1; then
  npm install -g agent-browser
fi

# Download Chrome for Testing + Linux system deps (no-op if already installed).
if ! agent-browser install --with-deps; then
  # Chrome-for-Testing download can be blocked by this environment's network
  # policy. Fall back to a pre-installed Chromium (e.g. Playwright's) instead
  # of failing the session start.
  shopt -s nullglob
  candidates=(
    "${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}"/chromium-*/chrome-linux/chrome
    /opt/pw-browsers/chromium-*/chrome-linux/chrome
  )
  for candidate in "${candidates[@]}"; do
    if [ -x "$candidate" ]; then
      echo "export AGENT_BROWSER_EXECUTABLE_PATH=\"$candidate\"" >> "${CLAUDE_ENV_FILE:-/dev/null}"
      echo "agent-browser: using fallback Chromium at $candidate"
      break
    fi
  done
fi

exit 0
