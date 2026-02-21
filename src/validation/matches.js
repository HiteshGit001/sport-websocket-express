import { z } from 'zod';

/**
 * MATCH_STATUS: constant with lowercase key-value pairs
 */
export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  FINISHED: 'finished',
};

/**
 * listMatchesQuerySchema: validates an optional limit as a coerced positive integer (max 100)
 */
export const listMatchesQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

/**
 * matchIdParamSchema: validates a required id as a coerced positive integer
 */
export const matchIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

/**
 * createMatchSchema:
 * - sport, homeTeam, awayTeam: non-empty strings
 * - startTime, endTime: valid ISO date strings
 * - endTime must be after startTime
 * - homeScore, awayScore: optional coerced non-negative integers
 */
export const createMatchSchema = z.object({
  sport: z.string().min(1),
  homeTeam: z.string().min(1),
  awayTeam: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  homeScore: z.coerce.number().int().nonnegative().optional(),
  awayScore: z.coerce.number().int().nonnegative().optional(),
}).superRefine((data, ctx) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  if (end <= start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "endTime must be chronologically after startTime",
      path: ["endTime"],
    });
  }
});

/**
 * updateScoreSchema: requires homeScore and awayScore as coerced non-negative integers
 */
export const updateScoreSchema = z.object({
  homeScore: z.coerce.number().int().nonnegative(),
  awayScore: z.coerce.number().int().nonnegative(),
});
