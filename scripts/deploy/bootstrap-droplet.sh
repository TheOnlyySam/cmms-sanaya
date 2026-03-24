#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/atlas-cmms}"
REPO_URL="${REPO_URL:-}"
APP_USER="${APP_USER:-$USER}"
APP_GROUP="${APP_GROUP:-$APP_USER}"

if [[ -z "$REPO_URL" ]]; then
  echo "REPO_URL is required, for example:"
  echo "  REPO_URL=git@github.com:your-org/your-repo.git $0"
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y git
fi

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker installation failed."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y docker-compose-plugin
fi

sudo usermod -aG docker "$APP_USER" || true

sudo mkdir -p "$(dirname "$APP_DIR")"
sudo chown -R "$APP_USER:$APP_GROUP" "$(dirname "$APP_DIR")"

if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

mkdir -p logos config

echo "Droplet bootstrap completed."
echo "Next steps:"
echo "1. Create $APP_DIR/.env.production"
echo "2. Add GitHub Actions secrets: VPS_HOST, VPS_USER, VPS_SSH_KEY, VPS_PORT"
echo "3. Add GitHub Actions variables: DEPLOY_PATH=$APP_DIR and DEPLOY_ENV_FILE=.env.production"
echo "4. Run: docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.production.yml up -d --build"
