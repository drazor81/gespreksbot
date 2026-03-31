// @vitest-environment node
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createSessionToken } from '../../server/lib/session-tokens';
import { createApp } from '../../server/app';

describe('session auth', () => {
  it('returns 401 for protected AI routes without bearer token', async () => {
    const app = createApp();
    const response = await request(app).post('/api/ai-mode').send({});

    expect(response.status).toBe(401);
  });

  it('does not expose the removed legacy raw-prompt endpoint', async () => {
    process.env.SESSION_TOKEN_SECRET = '12345678901234567890123456789012';
    const token = await createSessionToken(process.env.SESSION_TOKEN_SECRET, 'session-removed-route');
    const app = createApp();
    const response = await request(app).post('/api/chat').set('Authorization', 'Bearer ' + token).send({});

    expect(response.status).toBe(404);
  });

  it('issues a short-lived session token', async () => {
    process.env.SESSION_AUTH_MODE = 'development';
    process.env.SESSION_TOKEN_SECRET = '12345678901234567890123456789012';

    const app = createApp();
    const response = await request(app).post('/api/session').send({ challengeToken: 'dev-bypass' });

    expect(response.status).toBe(200);
    expect(response.body.sessionToken).toEqual(expect.any(String));
    expect(response.body.expiresInSeconds).toBe(900);
  });
});





