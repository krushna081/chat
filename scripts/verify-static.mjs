import assert from 'node:assert/strict';

process.env.NODE_ENV = 'production';
process.env.SERVE_CLIENT = 'true';
process.env.CLIENT_URL = 'http://127.0.0.1:5000';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/relaychat-static-check';
process.env.JWT_SECRET = 'static-check-access-secret-0123456789';
process.env.JWT_REFRESH_SECRET = 'static-check-refresh-secret-0123456789';
process.env.COOKIE_SECURE = 'false';
process.env.COOKIE_SAME_SITE = 'lax';
process.env.TRUST_PROXY = 'false';

const { default: app } = await import('../server/app.js');

const server = app.listen(0, '127.0.0.1', async () => {
  const { port } = server.address();
  let exitCode = 0;

  try {
    const root = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(root.status, 200, 'GET / should serve the built index.html');
    assert.match(root.headers.get('content-type') || '', /text\/html/, 'GET / should return HTML');
    const html = await root.text();
    assert.match(html, /<div id="root"><\/div>/, 'index.html should contain the React root');

    const route = await fetch(`http://127.0.0.1:${port}/dashboard`);
    assert.equal(route.status, 200, 'SPA routes should fall back to index.html');

    const health = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(health.status, 200, 'Health endpoint should be available');
    assert.equal((await health.json()).service, 'relaychat');

    const missing = await fetch(`http://127.0.0.1:${port}/api/not-a-route`);
    assert.equal(missing.status, 404, 'Unknown API routes should remain JSON 404s');

    console.info('Single-service static serving verified');
  } catch (error) {
    console.error(error);
    exitCode = 1;
  } finally {
    server.close(() => {
      process.exitCode = exitCode;
    });
  }
});
