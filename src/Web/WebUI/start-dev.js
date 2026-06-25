'use strict';

const path = require('path');
const { spawn } = require('child_process');
const { name: appName } = require('./package.json');

const certificateBaseFolder = process.env.APPDATA
  ? path.join(process.env.APPDATA, 'ASP.NET', 'https')
  : path.join(process.env.HOME, '.aspnet', 'https');

const certificateFile = path.join(certificateBaseFolder, `${appName}.pem`);
const keyFile = path.join(certificateBaseFolder, `${appName}.key`);
const angularCliEntryPoint = path.resolve(__dirname, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');

const child = spawn(process.execPath, [
  angularCliEntryPoint,
  'serve',
  '--configuration',
  'development',
  '--ssl',
  '--ssl-cert',
  certificateFile,
  '--ssl-key',
  keyFile,
  '--host',
  '127.0.0.1',
  '--port',
  '4200',
], {
  stdio: 'inherit',
});

child.on('error', (error) => {
  console.error('[start-dev] Failed to start ng serve:', error.message);
  process.exit(1);
});

child.on('exit', (code) => process.exit(code ?? 1));
