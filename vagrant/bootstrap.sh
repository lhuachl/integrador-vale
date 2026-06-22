#!/usr/bin/env bash
set -euo pipefail

echo "=== Avior SIU — Bootstrap Provision ==="

# ─── System Dependencies ─────────────────────────────────────────────────────
sudo apt-get update -qq
sudo apt-get install -y -qq \
  curl \
  unzip \
  git \
  build-essential \
  libgtk-3-0 \
  libnotify4 \
  libnss3 \
  libxss1 \
  libasound2 \
  libgbm1 \
  xvfb

# ─── Node.js 22 LTS ──────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y -qq nodejs
fi
echo "Node: $(node -v)"

# ─── pnpm ─────────────────────────────────────────────────────────────────────
if ! command -v pnpm &>/dev/null; then
  npm install -g pnpm@latest
fi
echo "pnpm: $(pnpm -v)"

# ─── Bun ──────────────────────────────────────────────────────────────────────
if ! command -v bun &>/dev/null; then
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
fi
echo "Bun: $(bun -v)"

# Add bun to profile
if ! grep -q 'bun' ~/.bashrc 2>/dev/null; then
  echo 'export BUN_INSTALL="$HOME/.bun"' >> ~/.bashrc
  echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> ~/.bashrc
fi

# ─── Playwright Browsers ─────────────────────────────────────────────────────
if command -v npx &>/dev/null; then
  cd /home/vagrant/avior-siu/apps/UI || exit 1
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install
  npx playwright install chromium --with-deps 2>/dev/null || true
fi

# ─── InsForge CLI ────────────────────────────────────────────────────────────
if ! command -v insforge &>/dev/null; then
  npm install -g @insforge/cli 2>/dev/null || true
fi

# ─── API .env.local ──────────────────────────────────────────────────────────
ENV_FILE="/home/vagrant/avior-siu/apps/api/.env.local"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<'EOF'
INSFORGE_URL=https://yj3acv2g.us-east.insforge.app
INSFORGE_ANON_KEY=ik_a16e44f4269dd03d129cac16dcaf8d3c
INSFORGE_SERVICE_KEY=ik_a16e44f4269dd03d129cac16dcaf8d3c
CORS_ORIGINS=http://localhost:1420
PORT=3000
EOF
  echo "Created $ENV_FILE"
fi

# ─── UI .env.development ─────────────────────────────────────────────────────
UI_ENV="/home/vagrant/avior-siu/apps/UI/.env.development"
if [ -f "$UI_ENV" ]; then
  sed -i 's/VITE_USE_MOCKS=true/VITE_USE_MOCKS=false/' "$UI_ENV"
  sed -i 's|VITE_API_URL=.*|VITE_API_URL=http://localhost:3000|' "$UI_ENV"
fi

# ─── Install Dependencies ────────────────────────────────────────────────────
echo "Installing project dependencies..."
cd /home/vagrant/avior-siu/apps/api && bun install
cd /home/vagrant/avior-siu/apps/UI && pnpm install

echo ""
echo "=== Bootstrap Complete ==="
echo "Run: vagrant ssh && cd ~/avior-siu && make dev-api    (terminal 1)"
echo "                    && cd ~/avior-siu && make dev-ui    (terminal 2)"
