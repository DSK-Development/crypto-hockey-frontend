const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 3000;
const distDir = path.join(__dirname, 'dist');

console.log('PORT env:', process.env.PORT);
console.log('Using port:', port);
console.log('__dirname:', __dirname);
console.log('distDir:', distDir);
console.log('dist exists:', fs.existsSync(distDir));
if (fs.existsSync(distDir)) {
  console.log('dist contents:', fs.readdirSync(distDir).slice(0, 5));
}

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

http.createServer((req, res) => {
  let filePath = path.join(distDir, req.url === '/' ? 'index.html' : req.url);
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
