const http = require('http');
const fs = require('fs');
const path = require('path');

const DEFAULT_PORT = Number(process.env.PORT) || 3000;
const HOST = '127.0.0.1';
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.wav': 'audio/wav',
};

function sendJson(res, status, payload) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(body);
}

function createAppServer() {
  return http.createServer((req, res) => {
    const parsedUrl = new URL(req.url || '/', `http://${HOST}`);
    const pathname = decodeURIComponent(parsedUrl.pathname || '/');
    const apiAction = parsedUrl.searchParams.get('api');

    if (apiAction) {
      const fixturePath = path.join(ROOT, 'api', `${apiAction}.json`);
      if (req.method === 'GET' && fs.existsSync(fixturePath)) {
        const content = fs.readFileSync(fixturePath, 'utf8');
        return sendJson(res, 200, content);
      }
      return sendJson(res, 200, {
        ok: true,
        status: 'ok',
        authorized: true,
        verified: true,
        plan: 'free',
        items: [],
      });
    }

    let targetPath = pathname;
    if (
      targetPath === '/' ||
      targetPath === '/app' ||
      targetPath === '/app/' ||
      targetPath === '/login'
    ) {
      targetPath = '/index.html';
    }

    const safePath = path.normalize(targetPath).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(ROOT, safePath);

    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const ext = path.extname(fullPath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      });
      fs.createReadStream(fullPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Not Found: ${pathname}`);
    }
  });
}

function startServer(port) {
  const server = createAppServer();

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(
        `[Aviso] A porta ${port} ja esta em uso (o servidor ja estava rodando em segundo plano).`
      );
      console.log(`Voce ja pode acessar direto no navegador: http://${HOST}:${port}/app`);
      const nextPort = port + 1;
      console.log(`Iniciando tambem uma instancia adicional na porta ${nextPort}...`);
      startServer(nextPort);
      return;
    }
    console.error('Erro no servidor:', err);
    process.exit(1);
  });

  server.listen(port, HOST, () => {
    console.log(`=============================================================`);
    console.log(`TechRib Local Clone (Tema Branco) rodando com sucesso!`);
    console.log(`Abra no navegador: http://${HOST}:${port}/app`);
    console.log(`=============================================================`);
  });
}

startServer(DEFAULT_PORT);
