import { z } from 'zod';

import { SOEP_SETTINGS_OPTIES } from './soep-settings';

// Gedeeld contract voor de SOEP-rapportagemodus (soepie).
// Bevat uitsluitend PUBLIEKE types en het request-schema. Verborgen casusdata
// (ijkpunten, valkuil, foutconcept, juiste ordening) leeft in
// src/shared/soep-casussen.ts en wordt NOOIT vanuit de frontend geïmporteerd.

export type SoepCategorie = 'S' | 'O' | 'E' | 'P';

/** Eén losse, labelbare uitspraak voor de ordenoefening (niveau 1) — zonder het juiste antwoord. */
export interface PublicSoepOrdenItem {
  id: string;
  tekst: string;
}

/** De casusvelden die de student mag zien. Bevat geen ijkpunten/valkuil/foutconcept. */
export interface PublicSoepCasus {
  id: string;
  naam: string;
  setting: string;
  casustekst: string;
  ordenItems: PublicSoepOrdenItem[];
  contextvariant?: string;
}

// --- Request-schema voor POST /api/soep-mode -------------------------------

export const soepCategorieSchema = z.enum(['S', 'O', 'E', 'P']);

export const soepLengteSchema = z.enum(['kort', 'uitgebreid']);
export type SoepLengte = z.infer<typeof soepLengteSchema>;

// Generatieverzoek (niveau 4): student kiest werkveld + lengte. De werkveldlijst
// leeft zod-vrij in soep-settings.ts zodat de frontend die kan importeren zonder zod.
export const soepGenereerRequestSchema = z
  .object({
    setting: z.enum(SOEP_SETTINGS_OPTIES),
    lengte: soepLengteSchema
  })
  .strict();

export type SoepGenereerRequest = z.infer<typeof soepGenereerRequestSchema>;

const ordenenRequestSchema = z
  .object({
    actie: z.literal('ordenen'),
    casusId: z.string().min(1).max(40),
    niveau: z.literal(1),
    toewijzingen: z
      .array(
        z
          .object({
            itemId: z.string().min(1).max(40),
            gekozen: soepCategorieSchema
          })
          .strict()
      )
      .min(1)
      .max(40)
  })
  .strict();

const feedbackRequestSchema = z
  .object({
    actie: z.literal('feedback'),
    // Precies één van casusId (bankcasus) of casusTicket (gegenereerde casus);
    // afgedwongen in soepModeRequestSchema.superRefine hieronder.
    casusId: z.string().min(1).max(40).optional(),
    casusTicket: z.string().min(1).max(20_000).optional(),
    niveau: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    transcript: z.string().min(1).max(10_000),
    onderdeel: soepCategorieSchema.optional()
  })
  .strict();

export const soepModeRequestSchema = z
  .discriminatedUnion('actie', [ordenenRequestSchema, feedbackRequestSchema])
  .superRefine((data, ctx) => {
    if (data.actie !== 'feedback') return;
    const heeftId = typeof data.casusId === 'string';
    const heeftTicket = typeof data.casusTicket === 'string';
    if (heeftId === heeftTicket) {
      ctx.addIssue({ code: 'custom', message: 'Geef precies één van casusId of casusTicket op.' });
    }
    // Een gegenereerde casus (ticket) bestaat alleen op niveau 4.
    if (heeftTicket && data.niveau !== 4) {
      ctx.addIssue({ code: 'custom', message: 'Een gegenereerde casus kan alleen op niveau 4.' });
    }
  });

export type SoepModeRequest = z.infer<typeof soepModeRequestSchema>;
export type SoepOrdenenRequest = z.infer<typeof ordenenRequestSchema>;
export type SoepFeedbackRequest = z.infer<typeof feedbackRequestSchema>;
