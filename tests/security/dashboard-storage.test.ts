import { beforeEach, describe, expect, it } from 'vitest';
import { DASHBOARD_STORAGE_KEY } from '../../src/config';
import { loadDashboardSessions } from '../../src/ui';

describe('dashboard storage hygiene', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('drops expired dashboard entries', () => {
    localStorage.setItem(
      DASHBOARD_STORAGE_KEY,
      JSON.stringify([
        {
          id: '1',
          dateIso: '2020-01-01T00:00:00.000Z',
          studentName: 'Test',
          setting: 'GGZ',
          scenario: 'Intake',
          leerdoelen: ['LSD'],
          niveau: 'Basis',
          turns: 3,
          scores: null
        }
      ])
    );

    expect(loadDashboardSessions()).toEqual([]);
  });

  it('keeps recent dashboard entries', () => {
    const recentSession = {
      id: '2',
      dateIso: new Date().toISOString(),
      studentName: 'Recent',
      setting: 'GGZ',
      scenario: 'Intake',
      leerdoelen: ['LSD'],
      niveau: 'Basis',
      turns: 4,
      scores: null
    };

    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify([recentSession]));

    expect(loadDashboardSessions()).toEqual([recentSession]);
  });
});
