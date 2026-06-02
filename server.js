const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const distDir = path.join(__dirname, 'dist');

function normalizeRuntimeUrl(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().replace(/\/$/, '');
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return '';
  try {
    const url = new URL(trimmed);
    return ['http:', 'https:', 'ws:', 'wss:'].includes(url.protocol) ? trimmed : '';
  } catch {
    return '';
  }
}

// Runtime env (Railway) — no Vite rebuild required. Falls back to VITE_* if set in image.
const runtimeConfig = {
  botApiUrl: normalizeRuntimeUrl(process.env.BOT_API_URL || process.env.VITE_BOT_API_URL),
  engineWsUrl: normalizeRuntimeUrl(process.env.ENGINE_WS_URL || process.env.VITE_ENGINE_WS_URL),
};

console.log('PORT env:', process.env.PORT);
console.log('Using port:', port);
console.log('Runtime botApiUrl:', runtimeConfig.botApiUrl || '(not set)');
console.log('Runtime engineWsUrl:', runtimeConfig.engineWsUrl ? '(set)' : '(not set)');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(body));
}

http.createServer((req, res) => {
  const url = req.url?.split('?')[0] ?? '/';

  if (url === '/runtime-config.json') {
    sendJson(res, 200, runtimeConfig);
    return;
  }

  let filePath = path.join(distDir, url === '/' ? 'index.html' : url);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(distDir, 'index.html'), (e, d) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(d);
      });
    } else {
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    }
  });
}).listen(port, '0.0.0.0', () => {
  console.log(`Listening on port ${port}`);
});
