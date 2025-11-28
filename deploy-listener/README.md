Deploy Listener (Node.js)
=========================

This small service accepts a POST to `/deploy-reservation` with header `X-Deploy-Token: <secret>` and executes the repo's `scripts/staging-deploy.sh` locally.

Quick install (on Debian/Ubuntu):

1. Install Node.js 20+ (NodeSource):

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. Copy files to `/opt/deploy-listener` and install deps:

```bash
sudo mkdir -p /opt/deploy-listener
sudo chown $USER:$USER /opt/deploy-listener
cp -r deploy-listener/* /opt/deploy-listener/
cd /opt/deploy-listener
npm ci --production
```

3. Create a `deploy-listener.service` systemd unit (example provided in this repo). Edit `DEPLOY_TOKEN` in the unit or configure an EnvironmentFile.

4. Start and enable the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now deploy-listener
sudo journalctl -u deploy-listener -f
```

Security:
- Use a long random `DEPLOY_TOKEN` and keep it in Jenkins credentials (Secret text `STAGING_DEPLOY_TOKEN`).
- Restrict access to the port via firewall (allow only Jenkins host).
- Consider placing an Nginx reverse proxy with TLS in front of the listener.
