#!/bin/bash
set -e

# Setup authorized_keys from env var or mounted file
mkdir -p /root/.ssh
chmod 700 /root/.ssh
if [ -n "$AUTHORIZED_KEYS" ]; then
    echo "$AUTHORIZED_KEYS" > /root/.ssh/authorized_keys
    chmod 600 /root/.ssh/authorized_keys
    chown root:root /root/.ssh/authorized_keys
elif [ -f /tmp/host_authorized_keys ]; then
    cp /tmp/host_authorized_keys /root/.ssh/authorized_keys
    chmod 600 /root/.ssh/authorized_keys
    chown root:root /root/.ssh/authorized_keys
fi

# Export runtime env vars to SSH sessions
printenv | grep -E '^(GH_TOKEN|ANTHROPIC_API_KEY|TELEGRAM_BOT_TOKEN|TELEGRAM_ALLOWED_USERS)=' >> /etc/environment

# Start Hermes Gateway with auto-restart in background
(
  source /opt/hermes/.venv/bin/activate
  while true; do
    echo "[entrypoint] Starting Hermes Gateway..."
    HERMES_ALLOW_ROOT_GATEWAY=1 /opt/hermes/.venv/bin/hermes gateway run >> /root/.hermes/logs/gateway.log 2>&1
    echo "[entrypoint] Gateway exited. Restarting in 3s..."
    sleep 3
  done
) &

# Start Hermes Dashboard on port 9119
(
  source /opt/hermes/.venv/bin/activate
  echo "[entrypoint] Starting Hermes Dashboard on :9119..."
  /opt/hermes/.venv/bin/hermes dashboard --port 9119 --host 0.0.0.0 --insecure --skip-build --tui >> /root/.hermes/logs/dashboard.log 2>&1
  echo "[entrypoint] Dashboard exited."
) &

# Start Hermes WebUI (nesquena) on port 8787
(
  mkdir -p /root/.hermes/logs
  cd /opt/hermes-webui
  while true; do
    echo "[entrypoint] Starting Hermes WebUI on :8787..."
    HERMES_HOME=/root/.hermes HERMES_WEBUI_AGENT_DIR=/opt/hermes/.venv/lib/python3.13/site-packages /opt/hermes/.venv/bin/python server.py >> /root/.hermes/logs/webui.log 2>&1
    echo "[entrypoint] WebUI exited. Restarting in 3s..."
    sleep 3
  done
) &

# sshd as main process keeps the container alive
exec /usr/sbin/sshd -D
