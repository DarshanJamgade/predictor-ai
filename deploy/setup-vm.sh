#!/usr/bin/env bash
# Run on Ubuntu/Debian VM (Oracle Cloud, GCP e2-micro, etc.)
# Usage: sudo bash deploy/setup-vm.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/predictor-ai}"
SERVICE_NAME="predictor-api"

echo "==> Predictor AI — VM backend setup"
echo "    Install path: $APP_DIR"

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "Please run as root: sudo bash deploy/setup-vm.sh"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")"

if [[ ! -f "$SOURCE_DIR/backend/main.py" ]]; then
  echo "Error: backend/main.py not found. Run this script from the cloned repo."
  exit 1
fi

echo "==> Installing system packages..."
apt-get update -qq
apt-get install -y python3 python3-venv python3-pip git rsync

echo "==> Syncing app to $APP_DIR..."
mkdir -p "$APP_DIR"
rsync -a --delete \
  --exclude backend/venv \
  --exclude node_modules \
  --exclude frontend/dist \
  --exclude .git \
  "$SOURCE_DIR/" "$APP_DIR/"

echo "==> Creating Python virtualenv..."
cd "$APP_DIR/backend"
python3 -m venv venv
source venv/bin/activate

echo "==> Installing dependencies (CPU-only PyTorch for smaller footprint)..."
pip install --upgrade pip
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements-local.txt

if [[ ! -f "$APP_DIR/backend/.env" ]]; then
  cp "$APP_DIR/backend/.env.example" "$APP_DIR/backend/.env"
  echo ""
  echo "!! Created $APP_DIR/backend/.env from template."
  echo "!! Edit CORS_ORIGINS to your Vercel URL before starting the service."
  echo ""
fi

echo "==> Installing systemd service..."
sed "s|/opt/predictor-ai|$APP_DIR|g" "$APP_DIR/deploy/predictor-api.service" \
  > "/etc/systemd/system/${SERVICE_NAME}.service"

systemctl daemon-reload
systemctl enable "$SERVICE_NAME"
systemctl restart "$SERVICE_NAME"

echo ""
echo "==> Setup complete!"
echo "    Health check: curl http://localhost:8080/"
echo "    Logs:         journalctl -u $SERVICE_NAME -f"
echo ""
echo "Next steps:"
echo "  1. Edit $APP_DIR/backend/.env — set CORS_ORIGINS to your Vercel URL"
echo "  2. Open port 8080 (or 443 with nginx) in your cloud firewall"
echo "  3. Set VITE_API_URL in Vercel to http://YOUR_VM_IP:8080 (or https://api.yourdomain.com)"
echo "  4. systemctl restart $SERVICE_NAME after changing .env"
