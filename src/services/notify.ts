import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';

export function startNotifyServer(port: number = 3001, token?: string) {
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method !== 'POST' || req.url !== '/notify') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const headerToken = (req.headers['x-notify-token'] as string) || '';
      if (token && headerToken !== token) {
        res.writeHead(401);
        res.end(JSON.stringify({ ok: false, error: 'invalid token' }));
        return;
      }

      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }

      let payload: any = {};
      try {
        payload = JSON.parse(body || '{}');
      } catch (e) {
        Logger.warn('Notify server received non-JSON body, treating as raw text');
        payload = { continuation: body };
      }

      const continuation: string = payload.continuation || '';
      let target: string = payload.target || 'src/continuation.txt';

      // sanitize target to repo-relative path
      if (!path.isAbsolute(target)) {
        target = path.join(process.cwd(), target);
      }

      // Prevent writing outside the repo root
      const repoRoot = process.cwd();
      if (!target.startsWith(repoRoot)) {
        res.writeHead(400);
        res.end(JSON.stringify({ ok: false, error: 'invalid target path' }));
        return;
      }

      // Ensure parent exists
      const parent = path.dirname(target);
      fs.mkdirSync(parent, { recursive: true });

      fs.writeFileSync(target, continuation + '\n', { encoding: 'utf8' });
      Logger.info(`Notify: wrote continuation to ${target}`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, wrote: target }));
    } catch (err) {
      Logger.error('Notify server error', err as any);
      res.writeHead(500);
      res.end(JSON.stringify({ ok: false, error: String(err) }));
    }
  });

  server.listen(port, () => {
    Logger.info(`Notify server listening on http://localhost:${port}/notify`);
  });

  return server;
}
