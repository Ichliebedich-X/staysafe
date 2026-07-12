const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const AMap_API_KEY = '07c707965ecf73aee6a5ba0edc5340aa';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (pathname.startsWith('/api/amap')) {
    const query = parsedUrl.query;
    const amapPath = pathname.replace('/api/amap', '');

    const amapUrl = `https://restapi.amap.com${amapPath}?${new URLSearchParams({ ...query, key: AMap_API_KEY })}`;

    console.log('Proxying request to:', amapUrl);

    const amapReq = https.get(amapUrl, (amapRes) => {
      console.log('AMap response status:', amapRes.statusCode);
      console.log('AMap response headers:', amapRes.headers);

      res.writeHead(amapRes.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });

      let responseBody = '';
      amapRes.on('data', (chunk) => {
        responseBody += chunk;
        res.write(chunk);
      });

      amapRes.on('end', () => {
        console.log('AMap response body:', responseBody.substring(0, 500));
        res.end();
      });
    });

    amapReq.on('error', (error) => {
      console.error('AMap API error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch data from AMap' }));
    });

    return;
  }

  let filePath = '.' + pathname;
  if (filePath === './') {
    filePath = './staysafe-platform.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('File not found', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log('AMap API proxy available at http://localhost:${PORT}/api/amap/');
});