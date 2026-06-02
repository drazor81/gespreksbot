// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  createCasusTicket,
  readCasusTicket,
  SoepTicketError,
  type CasusTicketPayload
} from '../../server/lib/soep-ticket';

const SECRET = 'test-sessiesleutel-minstens-32-tekens-1234567890';

const payload: CasusTicketPayload = {
  naam: 'Mevrouw Testpersoon',
  setting: 'Thuiszorg',
  casustekst: 'Een fictieve casus die alleen voor de test bestaat.',
  soepIjkpunten: { s: 'subjectief', o: 'objectief', e: 'evaluatie', p: 'plan' },
  valkuil: 'UNIEKE-SENTINEL-VALKUIL-XYZ'
};

describe('soep-ticket', () => {
  it('round-trip levert exact dezelfde payload', async () => {
    const ticket = await createCasusTicket(SECRET, payload);
    const gelezen = await readCasusTicket(SECRET, ticket);
    expect(gelezen).toEqual(payload);
  });

  it('versleutelt de inhoud: de valkuil-sentinel staat in geen enkel ticketsegment leesbaar', async () => {
    const ticket = await createCasusTicket(SECRET, payload);
    expect(ticket).not.toContain('UNIEKE-SENTINEL-VALKUIL-XYZ');
    // Bij louter ondertekenen (JWS) zou een segment base64url naar leesbare JSON decoderen.
    // Bij JWE blijven de segmenten ciphertext → de sentinel komt nergens leesbaar terug.
    const segmentenLeesbaar = ticket
      .split('.')
      .map((seg) => Buffer.from(seg, 'base64url').toString('utf8'))
      .join('|');
    expect(segmentenLeesbaar).not.toContain('UNIEKE-SENTINEL-VALKUIL-XYZ');
  });

  it('weigert een gemanipuleerd ticket', async () => {
    const ticket = await createCasusTicket(SECRET, payload);
    const geknoeid = ticket.slice(0, -3) + (ticket.endsWith('AAA') ? 'BBB' : 'AAA');
    await expect(readCasusTicket(SECRET, geknoeid)).rejects.toBeInstanceOf(SoepTicketError);
  });

  it('weigert een verkeerd secret', async () => {
    const ticket = await createCasusTicket(SECRET, payload);
    await expect(readCasusTicket('heel-ander-secret-minstens-32-tekens-0987654321', ticket)).rejects.toBeInstanceOf(
      SoepTicketError
    );
  });

  it('weigert onzin in plaats van een ticket', async () => {
    await expect(readCasusTicket(SECRET, 'dit.is.geen.geldig.ticket')).rejects.toBeInstanceOf(SoepTicketError);
  });
});
