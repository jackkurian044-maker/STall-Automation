import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // CORS & Security Headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Digital Asset Links for Android verification
  app.get('/.well-known/assetlinks.json', (req, res) => {
    res.json([
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: 'com.storeautomation.app',
          sha256_cert_fingerprints: [
            '14:6D:E9:CD:07:4B:43:B1:00:54:FF:AB:A1:23:45:67:89:AB:CD:EF:01:23:45:67:89:AB:CD:EF:01:23:45:67',
          ],
        },
      },
    ]);
  });

  // Apple App Site Association for iOS Universal Links
  app.get('/.well-known/apple-app-site-association', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json({
      applinks: {
        apps: [],
        details: [
          {
            appID: 'TEAMID12345.com.storeautomation.ios',
            paths: ['/auth/callback*', '/app/*'],
          },
        ],
      },
      webcredentials: {
        apps: ['TEAMID12345.com.storeautomation.ios'],
      },
    });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      backend: 'Firebase Authentication & Cloud Firestore',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  });

  // Helper: extract Google access token from Authorization header
  const getGoogleToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  };

  // Helper: normalize Google Business Profile path
  const normalizeLocationPath = (accountName: string, locationName: string): string => {
    if (locationName.startsWith('accounts/')) return locationName;
    const acc = accountName.startsWith('accounts/') ? accountName : `accounts/${accountName}`;
    const loc = locationName.startsWith('locations/') ? locationName : `locations/${locationName}`;
    return `${acc}/${loc}`;
  };

  // Secure Server Proxy: GBP Accounts
  app.get('/api/gbp/accounts', async (req: Request, res: Response) => {
    const token = getGoogleToken(req);
    if (!token) {
      return res.status(401).json({ error: { message: 'Missing Authorization Bearer token' } });
    }
    try {
      const gRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await gRes.json();
      return res.status(gRes.status).json(data);
    } catch (err: any) {
      return res.status(502).json({ error: { message: `Google upstream connection failed: ${err.message}` } });
    }
  });

  // Secure Server Proxy: GBP Locations
  app.get('/api/gbp/locations', async (req: Request, res: Response) => {
    const token = getGoogleToken(req);
    const accountName = req.query.accountName as string;
    if (!token || !accountName) {
      return res.status(400).json({ error: { message: 'Missing token or accountName' } });
    }
    try {
      const cleanAcc = accountName.startsWith('accounts/') ? accountName : `accounts/${accountName}`;
      const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${cleanAcc}/locations?readMask=name,title,storefrontAddress,websiteUri,phoneNumbers,categories,regularHours`;
      const gRes = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await gRes.json();
      return res.status(gRes.status).json(data);
    } catch (err: any) {
      return res.status(502).json({ error: { message: `Google upstream connection failed: ${err.message}` } });
    }
  });

  // Secure Server Proxy: GBP Reviews
  app.get('/api/gbp/reviews', async (req: Request, res: Response) => {
    const token = getGoogleToken(req);
    const accountName = req.query.accountName as string;
    const locationName = req.query.locationName as string;
    if (!token || !accountName || !locationName) {
      return res.status(400).json({ error: { message: 'Missing token, accountName, or locationName' } });
    }
    try {
      const fullPath = normalizeLocationPath(accountName, locationName);
      const url = `https://mybusiness.googleapis.com/v4/${fullPath}/reviews`;
      const gRes = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await gRes.json();
      return res.status(gRes.status).json(data);
    } catch (err: any) {
      return res.status(502).json({ error: { message: `Google upstream connection failed: ${err.message}` } });
    }
  });

  // Secure Server Proxy: GBP Review Reply
  app.put('/api/gbp/reviews/reply', async (req: Request, res: Response) => {
    const token = getGoogleToken(req);
    const { accountName, locationName, reviewId, comment } = req.body;
    if (!token || !accountName || !locationName || !reviewId || !comment) {
      return res.status(400).json({ error: { message: 'Missing required parameters' } });
    }
    try {
      const fullPath = normalizeLocationPath(accountName, locationName);
      const url = `https://mybusiness.googleapis.com/v4/${fullPath}/reviews/${reviewId}/reply`;
      const gRes = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment }),
      });
      const data = await gRes.json();
      return res.status(gRes.status).json(data);
    } catch (err: any) {
      return res.status(502).json({ error: { message: `Google upstream connection failed: ${err.message}` } });
    }
  });

  // Secure Server Proxy: GBP Local Posts
  app.post('/api/gbp/posts', async (req: Request, res: Response) => {
    const token = getGoogleToken(req);
    const { accountName, locationName, summary, callToAction } = req.body;
    if (!token || !accountName || !locationName || !summary) {
      return res.status(400).json({ error: { message: 'Missing required parameters' } });
    }
    try {
      const fullPath = normalizeLocationPath(accountName, locationName);
      const url = `https://mybusiness.googleapis.com/v4/${fullPath}/localPosts`;
      const gRes = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          languageCode: 'en-US',
          summary,
          topicType: 'STANDARD',
          callToAction,
        }),
      });
      const data = await gRes.json();
      return res.status(gRes.status).json(data);
    } catch (err: any) {
      return res.status(502).json({ error: { message: `Google upstream connection failed: ${err.message}` } });
    }
  });

  // Mount Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Store Automation server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
