const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT_DIR = path.resolve(__dirname);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.webp': 'image/webp',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.pdf':  'application/pdf',
  '.json': 'application/json',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  // 1. Restrict HTTP Methods (Only allow GET and HEAD)
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {
      'Content-Type': 'text/plain',
      'Allow': 'GET, HEAD'
    });
    res.end('405 Method Not Allowed');
    return;
  }

  // 2. Decode and sanitize URL path
  let reqPath;
  try {
    reqPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('400 Bad Request');
    return;
  }

  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  // 3. Prevent Path Traversal (Jail strictly within ROOT_DIR)
  const normalizedRelPath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.resolve(ROOT_DIR, '.' + path.sep + normalizedRelPath);

  const rel = path.relative(ROOT_DIR, filePath);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // 4. Clean URL Support: if file doesn't exist but .html exists, use it
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath += '.html';
  }

  // Verify filePath is still strictly jailed inside ROOT_DIR after clean URL append
  const postRel = path.relative(ROOT_DIR, filePath);
  if (postRel.startsWith('..') || path.isAbsolute(postRel)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  let ext = path.extname(filePath).toLowerCase();
  if (!ext && filePath.endsWith('.html')) {
    ext = '.html';
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'no-referrer-when-downgrade',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://formspree.io;"
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    fs.createReadStream(filePath).pipe(res);
  });
});

let currentPort = 3000;

function startServer(port) {
  server.listen(port, () => {
    console.log(`Live Preview Server running at http://localhost:${port}`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    currentPort++;
    console.log(`Port ${currentPort - 1} in use, trying http://localhost:${currentPort}...`);
    startServer(currentPort);
  } else {
    console.error(err);
  }
});

startServer(currentPort);
