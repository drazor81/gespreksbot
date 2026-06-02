// @vitest-environment node
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../server/app';
import { createSessionToken } from '../../server/lib/session-tokens';

const SECRET = '12345678901234567890123456789012';

async function tokenFor(sid: string): Promise<string> {
  process.env.SESSION_TOKEN_SECRET = SECRET;
  return createSessionToken(SECRET, sid);
}

describe('SOEP endpoints', () => {
  it('weigert POST /api/soep-mode zonder Bearer-token (401)', async () => {
    process.env.SESSION_TOKEN_SECRET = SECRET;
    const app = createApp();
    const response = await request(app)
      .post('/api/soep-mode')
      .send({ actie: 'feedback', casusId: 'van-dam', niveau: 4, transcript: 'iets' });
    expect(response.status).toBe(401);
  });

  it('weigert GET /api/soep-casussen zonder Bearer-token (401)', async () => {
    process.env.SESSION_TOKEN_SECRET = SECRET;
    const app = createApp();
    const response = await request(app).get('/api/soep-casussen');
    expect(response.status).toBe(401);
  });

  it('geeft 400 bij een ongeldige body (feedback met niveau 1)', async () => {
    const token = await tokenFor('soep-1');
    const app = createApp();
    const response = await request(app)
      .post('/api/soep-mode')
      .set('Authorization', `Bearer ${token}`)
      .send({ actie: 'feedback', casusId: 'van-dam', niveau: 1, transcript: 'iets' });
    expect(response.status).toBe(400);
  });

  it('geeft 400 bij een onbekende casusId (geen 500/stacktrace)', async () => {
    const token = await tokenFor('soep-2');
    const app = createApp();
    const response = await request(app)
      .post('/api/soep-mode')
      .set('Authorization', `Bearer ${token}`)
      .send({ actie: 'ordenen', casusId: 'bestaat-niet', niveau: 1, toewijzingen: [{ itemId: 'x', gekozen: 'S' }] });
    expect(response.status).toBe(400);
  });

  it('geeft de publieke casussen terug zonder verborgen velden', async () => {
    const token = await tokenFor('soep-3');
    const app = createApp();
    const response = await request(app).get('/api/soep-casussen').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.casussen)).toBe(true);
    expect(response.body.casussen.length).toBeGreaterThan(0);

    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain('soepIjkpunten');
    expect(serialized).not.toContain('foutConcept');
    expect(serialized).not.toContain('juist');
    expect(serialized).not.toContain('is ontstoken');
  });

  it('weigert POST /api/soep-casus zonder Bearer-token (401)', async () => {
    process.env.SESSION_TOKEN_SECRET = SECRET;
    const app = createApp();
    const response = await request(app).post('/api/soep-casus').send({ setting: 'Thuiszorg', lengte: 'kort' });
    expect(response.status).toBe(401);
  });

  it('geeft 400 bij een ongeldige setting voor /api/soep-casus', async () => {
    const token = await tokenFor('soep-gen-1');
    const app = createApp();
    const response = await request(app)
      .post('/api/soep-casus')
      .set('Authorization', `Bearer ${token}`)
      .send({ setting: 'Maanbasis', lengte: 'kort' });
    expect(response.status).toBe(400);
  });
});
