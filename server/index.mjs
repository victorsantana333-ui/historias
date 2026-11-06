import 'dotenv/config';
import express from 'express';
import { resolve } from 'node:path';
import { createApp } from './app.mjs';
const app = createApp();
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(resolve('dist')));
  app.get('*', (req, res) => res.sendFile(resolve('dist/index.html')));
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
}
const httpServer = app.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log('Página de doações disponível na porta configurada.'));

for (const signal of ['SIGTERM','SIGINT']) process.once(signal, () => {
  httpServer.close(() => { app.locals.close(); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
});
