import { createHash } from 'node:crypto';
import { EncryptJWT, jwtDecrypt } from 'jose';
import { z } from 'zod';

// Versleuteld "casus-ticket" voor gegenereerde SOEP-casussen (niveau 4).
// De verborgen ijkpunten + valkuil van een AI-gegenereerde casus staan in geen
// bestand; ze reizen versleuteld (JWE) via de client mee terug bij de feedback-call.
// VERSLEUTELD (niet enkel ondertekend) zodat de student het "ideale antwoord" niet
// kan lezen → anti-spieken blijft behouden, zonder server-side state.

const ijkpuntenSchema = z.object({
  s: z.string(),
  o: z.string(),
  e: z.string(),
  p: z.string()
});

export const casusTicketPayloadSchema = z.object({
  naam: z.string(),
  setting: z.string(),
  casustekst: z.string(),
  soepIjkpunten: ijkpuntenSchema,
  valkuil: z.string()
});

export type CasusTicketPayload = z.infer<typeof casusTicketPayloadSchema>;

/** Gegooid bij een ongeldig, gemanipuleerd of verlopen ticket → 400 in de route. */
export class SoepTicketError extends Error {
  constructor(message = 'Ongeldig of verlopen casus-ticket') {
    super(message);
    this.name = 'SoepTicketError';
  }
}

/** Leidt een 32-byte (256-bit) sleutel af voor A256GCM uit het sessiegeheim. */
function deriveTicketKey(secret: string): Uint8Array {
  return Uint8Array.from(createHash('sha256').update(secret).digest());
}

export async function createCasusTicket(secret: string, payload: CasusTicketPayload): Promise<string> {
  const key = deriveTicketKey(secret);
  return new EncryptJWT({ casus: payload })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime('4h')
    .encrypt(key);
}

export async function readCasusTicket(secret: string, ticket: string): Promise<CasusTicketPayload> {
  const key = deriveTicketKey(secret);
  try {
    const { payload } = await jwtDecrypt(ticket, key, {
      keyManagementAlgorithms: ['dir'],
      contentEncryptionAlgorithms: ['A256GCM']
    });
    return casusTicketPayloadSchema.parse((payload as { casus?: unknown }).casus);
  } catch (error) {
    throw new SoepTicketError(error instanceof Error ? error.message : undefined);
  }
}
