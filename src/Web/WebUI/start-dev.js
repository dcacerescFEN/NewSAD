// start-dev.js
// Starts the Angular dev server with SSL using the ASP.NET Core dev certificate.

'use strict';

const path      = require('path');
const { spawn } = require('child_process');
const { name: APP_NAME } = require('./package.json');

// ── Resolve certificate paths ───────────────────────────────────────────────

const CERT_BASE_FOLDER =
  process.env.APPDATA
    ? path.join(process.env.APPDATA, 'ASP.NET', 'https')
    : path.join(process.env.HOME,    '.aspnet',  'https');

const CERT_FILE = path.join(CERT_BASE_FOLDER, `${APP_NAME}.pem`);
const KEY_FILE  = path.join(CERT_BASE_FOLDER, `${APP_NAME}.key`);

// ── Resolve @angular/cli entry point directly ───────────────────────────────
//   Avoids all .cmd/.ps1 wrappers — calls node with the JS file directly.
//   This works on all platforms and all Node versions without shell:true.

const NG_JS = path.resolve(
  __dirname,
  'node_modules',
  '@angular',
  'cli',
  'bin',
  'ng.js'
);

// ── Launch ng serve ─────────────────────────────────────────────────────────

const child = spawn(
  process.execPath,           // the exact node binary currently running this script
  [
    NG_JS,
    'serve',
    '--ssl',
    '--ssl-cert', CERT_FILE,
    '--ssl-key',  KEY_FILE,
    '--host',     '127.0.0.1',
  ],
  {
    stdio: 'inherit',
  }
);

child.on('error', err => {
  console.error('[start-dev] Failed to start ng serve:', err.message);
  console.error('[start-dev] Tried to run:', NG_JS);
  process.exit(1);
});

child.on('exit', code => process.exit(code ?? 1));