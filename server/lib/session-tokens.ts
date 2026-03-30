import { SignJWT, jwtVerify } from 'jose';

const encoder = new TextEncoder();

export async function createSessionToken(secret: string, sid: string): Promise<string> {
  return new SignJWT({ sid, scope: 'ai' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(encoder.encode(secret));
}

export async function verifySessionToken(secret: string, token: string) {
  const verified = await jwtVerify(token, encoder.encode(secret));
  return verified.payload;
}
