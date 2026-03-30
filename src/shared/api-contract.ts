import { z } from 'zod';

export const roleSchema = z.enum(['user', 'assistant']);

export const messageSchema = z.object({
  role: roleSchema,
  content: z.string().min(1).max(10_000)
});

export const settingsSchema = z.object({
  setting: z.string().min(1),
  scenarioType: z.string().min(1),
  leerdoelen: z.array(z.string()).min(1).max(2),
  moeilijkheid: z.string().min(1),
  archetype: z.string().min(1),
  customScenario: z.string().max(1_000),
  customArchetype: z.string().max(250)
});

export const aiModeSchema = z.enum(['start', 'chat', 'coach', 'feedback', 'stream']);

export const aiModeRequestSchema = z
  .object({
    mode: aiModeSchema,
    settings: settingsSchema,
    history: z.array(messageSchema).max(100).default([]),
    message: z.string().max(10_000).optional(),
    selfAssessment: z.record(z.string(), z.string()).optional()
  })
  .strict();

export type AiModeRequest = z.infer<typeof aiModeRequestSchema>;
