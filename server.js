const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const distDir = path.join(__dirname, 'dist');

// Runtime env (Railway) — no Vite rebuild required. Falls back to VITE_* if set in image.
const runtimeConfig = {
  botApiUrl: (process.env.BOT_API_URL || process.env.VITE_BOT_API_URL || '').replace(/\/$/, ''),
  engineWsUrl: (process.env.ENGINE_WS_URL || process.env.VITE_ENGINE_WS_URL || '').replace(/\/$/, ''),
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
