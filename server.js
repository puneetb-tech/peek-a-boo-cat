const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(process.env.STATIC_ROOT || __dirname);
const port = Number(process.env.PORT) || 8080;
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png'
};

function send(response, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  response.writeHead(statusCode, {
    'Content-Type': contentType,
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  });
  response.end(body);
}

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    send(response, 400, 'Bad request');
    return;
  }

  if (pathname.endsWith('/')) pathname += 'index.html';
  const filePath = path.resolve(root, `.${pathname}`);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    send(response, 403, 'Forbidden');
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      send(response, 404, 'Not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
      'Content-Length': stats.size,
      'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=86400' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    });
    fs.createReadStream(filePath).pipe(response);
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Peek-a-Boo Kitty listening on port ${port}`);
});
