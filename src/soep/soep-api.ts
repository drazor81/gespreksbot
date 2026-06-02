import { API_BASE, throwForFailedResponse, withFreshSessionToken } from '../api';
import type { PublicSoepCasus, SoepGenereerRequest, SoepModeRequest } from '../shared/soep-contract';

// Dunne client voor de SOEP-rapportagemodus. Hergebruikt withFreshSessionToken
// (inclusief 401-refresh) uit api.ts; geen eigen tokenbeheer.

interface SoepModeResponse {
  response?: string;
  error?: string;
}

interface SoepCasussenResponse {
  casussen: PublicSoepCasus[];
}

interface SoepGenereerResponse {
  casus: PublicSoepCasus;
  ticket: string;
  error?: string;
}

export async function sendSoepModeRequest(request: SoepModeRequest, signal?: AbortSignal): Promise<SoepModeResponse> {
  return withFreshSessionToken(async (sessionToken) => {
    const response = await fetch(`${API_BASE}/api/soep-mode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`
      },
      signal,
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      await throwForFailedResponse(response, `SOEP error: ${response.status}`);
    }

    return (await response.json()) as SoepModeResponse;
  });
}

export async function genereerSoepCasus(
  request: SoepGenereerRequest,
  signal?: AbortSignal
): Promise<SoepGenereerResponse> {
  return withFreshSessionToken(async (sessionToken) => {
    const response = await fetch(`${API_BASE}/api/soep-casus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionToken}`
      },
      signal,
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      await throwForFailedResponse(response, `SOEP genereer error: ${response.status}`);
    }

    return (await response.json()) as SoepGenereerResponse;
  });
}

export async function fetchSoepCasussen(): Promise<PublicSoepCasus[]> {
  return withFreshSessionToken(async (sessionToken) => {
    const response = await fetch(`${API_BASE}/api/soep-casussen`, {
      headers: {
        Authorization: `Bearer ${sessionToken}`
      }
    });

    if (!response.ok) {
      await throwForFailedResponse(response, `SOEP casussen error: ${response.status}`);
    }

    const data = (await response.json()) as SoepCasussenResponse;
    return data.casussen;
  });
}
