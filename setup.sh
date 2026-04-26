#!/usr/bin/env bash
set -e

echo ""
echo "=========================================="
echo "  Decision Support Tool for Suspected Phishing Activity — Setup"
echo "=========================================="
echo ""

# ── 1. Check for Node.js ──────────────────────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo "Node.js is not installed."
  echo ""
  echo "Install it from: https://nodejs.org/  (LTS version recommended)"
  echo ""
  if [[ "$OSTYPE" == "darwin"* ]]; then
    if command -v brew &> /dev/null; then
      read -r -p "Install Node.js via Homebrew now? [y/N] " response
      if [[ "$response" =~ ^[Yy]$ ]]; then
        brew install node
      else
        echo "Please install Node.js manually, then re-run this script."
        exit 1
      fi
    else
      echo "Homebrew not found. Please install Node.js from https://nodejs.org/ and re-run."
      exit 1
    fi
  else
    echo "Please install Node.js from https://nodejs.org/ and re-run this script."
    exit 1
  fi
fi

NODE_VERSION=$(node -v)
echo "Node.js found: $NODE_VERSION"

# Warn if Node version is too old (need v18+)
NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo ""
  echo "Warning: Node.js v18 or higher is recommended (you have $NODE_VERSION)."
  echo "Visit https://nodejs.org/ to upgrade."
  echo ""
fi

# ── 2. Move into script directory (works when called from anywhere) ───────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── 3. Install dependencies ───────────────────────────────────────────────────
echo ""
echo "Installing dependencies..."
npm install

# ── 4. Launch dev server ──────────────────────────────────────────────────────
echo ""
echo "=========================================="
echo "  Starting Decision Support Tool for Suspected Phishing Activity..."
echo "  Open http://localhost:5173 in your browser"
echo "  Press Ctrl+C to stop"
echo "=========================================="
echo ""

# Try to open browser automatically (best-effort, won't fail if it can't)
if [[ "$OSTYPE" == "darwin"* ]]; then
  (sleep 2 && open "http://localhost:5173") &
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  (sleep 2 && xdg-open "http://localhost:5173" 2>/dev/null) &
fi

npm run dev
