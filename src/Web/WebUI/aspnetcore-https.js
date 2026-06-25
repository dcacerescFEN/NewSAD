'use strict';

const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

const baseFolder = process.env.APPDATA
  ? path.join(process.env.APPDATA, 'ASP.NET', 'https')
  : path.join(process.env.HOME, '.aspnet', 'https');

fs.mkdirSync(baseFolder, { recursive: true });

const certificateName = process.env.npm_package_name;

if (!certificateName) {
  console.error('Invalid certificate name. Run this script from an npm script context.');
  process.exit(1);
}

const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

if (fs.existsSync(certFilePath) && fs.existsSync(keyFilePath)) {
  process.exit(0);
}

const dotnetPath = process.env.DOTNET_ROOT
  ? path.join(process.env.DOTNET_ROOT, 'dotnet')
  : '/mnt/c/Program Files/dotnet/dotnet.exe';

spawn(dotnetPath, [
  'dev-certs',
  'https',
  '--export-path',
  certFilePath,
  '--format',
  'Pem',
  '--no-password',
], {
  stdio: 'inherit',
}).on('exit', (code) => process.exit(code ?? 1));
