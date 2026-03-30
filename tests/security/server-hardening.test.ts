// @vitest-environment node
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../server/app';

describe('server hardening', () => {
  it('removes x-powered-by header', async () => {
    const app = createApp();
    const response = await request(app).get('/does-not-exist');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('adds baseline helmet headers on 404 responses', async () => {
    const app = createApp();
    const response = await request(app).get('/does-not-exist');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });
});
