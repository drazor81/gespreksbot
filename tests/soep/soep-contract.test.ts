import { describe, expect, it } from 'vitest';
import { soepGenereerRequestSchema, soepModeRequestSchema } from '../../src/shared/soep-contract';
import { getPublicSoepCasussen, getSoepCasusById } from '../../src/shared/soep-casussen';

describe('soepModeRequestSchema', () => {
  it('accepteert een geldige ordenen-request (niveau 1)', () => {
    const result = soepModeRequestSchema.safeParse({
      actie: 'ordenen',
      casusId: 'van-dam',
      niveau: 1,
      toewijzingen: [
        { itemId: 'van-dam-1', gekozen: 'S' },
        { itemId: 'van-dam-3', gekozen: 'O' }
      ]
    });
    expect(result.success).toBe(true);
  });

  it('accepteert een geldige feedback-request (niveau 4)', () => {
    const result = soepModeRequestSchema.safeParse({
      actie: 'feedback',
      casusId: 'van-dam',
      niveau: 4,
      transcript: 'Mevrouw geeft aan pijn te hebben in haar linkerbeen.'
    });
    expect(result.success).toBe(true);
  });

  it('weigert ordenen met een ander niveau dan 1', () => {
    const result = soepModeRequestSchema.safeParse({
      actie: 'ordenen',
      casusId: 'van-dam',
      niveau: 2,
      toewijzingen: [{ itemId: 'van-dam-1', gekozen: 'S' }]
    });
    expect(result.success).toBe(false);
  });

  it('weigert feedback zonder transcript', () => {
    const result = soepModeRequestSchema.safeParse({
      actie: 'feedback',
      casusId: 'van-dam',
      niveau: 4
    });
    expect(result.success).toBe(false);
  });

  it('weigert feedback met niveau 1', () => {
    const result = soepModeRequestSchema.safeParse({
      actie: 'feedback',
      casusId: 'van-dam',
      niveau: 1,
      transcript: 'iets'
    });
    expect(result.success).toBe(false);
  });

  it('weigert een leeg transcript', () => {
    const result = soepModeRequestSchema.safeParse({
      actie: 'feedback',
      casusId: 'van-dam',
      niveau: 2,
      transcript: ''
    });
    expect(result.success).toBe(false);
  });

  it('weigert een transcript langer dan 10.000 tekens', () => {
    const result = soepModeRequestSchema.safeParse({
      actie: 'feedback',
      casusId: 'van-dam',
      niveau: 2,
      transcript: 'a'.repeat(10_001)
    });
    expect(result.success).toBe(false);
  });

  it('weigert een onbekende actie', () => {
    const result = soepModeRequestSchema.safeParse({
      actie: 'corrigeren',
      casusId: 'van-dam',
      niveau: 1
    });
    expect(result.success).toBe(false);
  });

  it('weigert onbekende velden (strict)', () => {
    const result = soepModeRequestSchema.safeParse({
      actie: 'feedback',
      casusId: 'van-dam',
      niveau: 2,
      transcript: 'iets',
      stiekem: 'extra'
    });
    expect(result.success).toBe(false);
  });

  it('weigert lege toewijzingen', () => {
    const result = soepModeRequestSchema.safeParse({
      actie: 'ordenen',
      casusId: 'van-dam',
      niveau: 1,
      toewijzingen: []
    });
    expect(result.success).toBe(false);
  });

  it('accepteert feedback met een casusTicket (gegenereerde casus, niveau 4)', () => {
    const result = soepModeRequestSchema.safeParse({
      actie: 'feedback',
      casusTicket: 'een.versleuteld.ticket',
      niveau: 4,
      transcript: 'Mevrouw geeft aan pijn te hebben.'
    });
    expect(result.success).toBe(true);
  });

  it('weigert feedback met zowel casusId als casusTicket', () => {
    const result = soepModeRequestSchema.safeParse({
      actie: 'feedback',
      casusId: 'van-dam',
      casusTicket: 'een.versleuteld.ticket',
      niveau: 4,
      transcript: 'iets'
    });
    expect(result.success).toBe(false);
  });

  it('weigert feedback zonder casusId én zonder casusTicket', () => {
    const result = soepModeRequestSchema.safeParse({
      actie: 'feedback',
      niveau: 4,
      transcript: 'iets'
    });
    expect(result.success).toBe(false);
  });

  it('weigert een casusTicket op een ander niveau dan 4', () => {
    const result = soepModeRequestSchema.safeParse({
      actie: 'feedback',
      casusTicket: 'een.versleuteld.ticket',
      niveau: 2,
      transcript: 'iets'
    });
    expect(result.success).toBe(false);
  });
});

describe('soepGenereerRequestSchema', () => {
  it('accepteert een geldig generatieverzoek', () => {
    expect(soepGenereerRequestSchema.safeParse({ setting: 'Thuiszorg', lengte: 'kort' }).success).toBe(true);
    expect(soepGenereerRequestSchema.safeParse({ setting: 'Ziekenhuis', lengte: 'uitgebreid' }).success).toBe(true);
  });

  it('weigert een onbekend werkveld', () => {
    expect(soepGenereerRequestSchema.safeParse({ setting: 'Maanbasis', lengte: 'kort' }).success).toBe(false);
  });

  it('weigert een onbekende lengte', () => {
    expect(soepGenereerRequestSchema.safeParse({ setting: 'Thuiszorg', lengte: 'episch' }).success).toBe(false);
  });

  it('weigert onbekende velden (strict)', () => {
    expect(
      soepGenereerRequestSchema.safeParse({ setting: 'Thuiszorg', lengte: 'kort', stiekem: 'extra' }).success
    ).toBe(false);
  });
});

describe('publieke casusprojectie (anti-spieken)', () => {
  it('lekt geen verborgen velden in de publieke casussen', () => {
    const publiek = getPublicSoepCasussen();
    expect(publiek.length).toBeGreaterThan(0);

    const serialized = JSON.stringify(publiek);
    expect(serialized).not.toContain('soepIjkpunten');
    expect(serialized).not.toContain('valkuil');
    expect(serialized).not.toContain('foutConcept');
    expect(serialized).not.toContain('ingebouwdeFouten');
    expect(serialized).not.toContain('juist');
    // sentinel uit een verborgen veld (foutConcept Van Dam)
    expect(serialized).not.toContain('is ontstoken');

    for (const casus of publiek) {
      for (const item of casus.ordenItems) {
        expect(item).not.toHaveProperty('juist');
      }
    }
  });

  it('houdt het juiste antwoord wel server-side beschikbaar', () => {
    const casus = getSoepCasusById('van-dam');
    expect(casus).toBeDefined();
    expect(casus?.ordenItems[0]).toHaveProperty('juist');
    expect(casus?.soepIjkpunten.o).toContain('warm');
  });
});
