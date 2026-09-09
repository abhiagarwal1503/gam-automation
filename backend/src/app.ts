import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import routes from './routes';
import { initDatabase } from './database/db';

export function createApp() {
  const app = express();

  // Middleware
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize SQLite database & tables
  initDatabase();

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Mount API routes
  app.use('/api', routes);

  // SEO: Serve robots.txt and sitemap.xml with proper content-type
  const publicPath = path.resolve(__dirname, '../../frontend/public');
  const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');

  app.get('/robots.txt', (req, res) => {
    const robotsFile = [
      path.join(frontendDistPath, 'robots.txt'),
      path.join(publicPath, 'robots.txt')
    ].find(p => fs.existsSync(p));

    if (robotsFile) {
      res.type('text/plain').sendFile(robotsFile);
    } else {
      res.type('text/plain').send('User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://dfp.blinkcms.ai/sitemap.xml\n');
    }
  });

  app.get('/sitemap.xml', (req, res) => {
    const sitemapFile = [
      path.join(frontendDistPath, 'sitemap.xml'),
      path.join(publicPath, 'sitemap.xml')
    ].find(p => fs.existsSync(p));

    if (sitemapFile) {
      res.type('application/xml').sendFile(sitemapFile);
    } else {
      res.status(404).send('Sitemap not found');
    }
  });

  // Serve static frontend assets in production if built
  if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled Server Error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal Server Error'
    });
  });

  return app;
}
