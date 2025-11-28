const express = require('express');
const { execFile } = require('child_process');
const fs = require('fs');

const PORT = process.env.LISTENER_PORT || 8088;
const TOKEN = process.env.DEPLOY_TOKEN;
const SCRIPT = process.env.DEPLOY_SCRIPT || '/srv/reservationRepo/scripts/staging-deploy.sh';
const WORKDIR = process.env.DEPLOY_WORKDIR || '/srv/reservationRepo';

if (!TOKEN) {
  console.error('DEPLOY_TOKEN not set - exiting');
  process.exit(1);
}

const app = express();
app.use(express.json());

app.post('/deploy-reservation', (req, res) => {
  const provided = req.get('X-Deploy-Token') || '';
  if (provided !== TOKEN) {
    console.warn('Unauthorized deploy attempt from', req.ip);
    return res.status(401).send('Unauthorized');
  }

  const lockFile = '/tmp/deploy_reservation.lock';
  if (fs.existsSync(lockFile)) {
    return res.status(423).send('Deployment already running');
  }
  fs.writeFileSync(lockFile, String(Date.now()));

  execFile(SCRIPT, { cwd: WORKDIR, env: process.env }, (err, stdout, stderr) => {
    try { fs.unlinkSync(lockFile); } catch (e) {}
    if (err) {
      console.error('Deploy failed:', err);
      console.error(stderr);
      return res.status(500).send('Deploy failed:\n' + (stderr || err.message));
    }
    console.log('Deploy success:\n', stdout);
    return res.status(200).send('Deploy started');
  });
});

app.get('/', (req, res) => res.send('deploy-listener OK'));

app.listen(PORT, () => console.log(`Listener running on ${PORT}`));
