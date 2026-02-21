import {Router} from 'express';
import {createMatchSchema, listMatchesQuerySchema} from "../validation/matches.js";
import {matches} from "../db/schema.js";
import {db} from "../db/db.js";
import {getMatchStatus} from "../utils/match-status.js";
import {desc} from "drizzle-orm";

export const matchRouter = Router();

const MAX_LIMIT = 100;
matchRouter.get('/', async (req, res) => {
    const parsed = listMatchesQuerySchema.safeParse(req.query);

    if (!parsed.success) {
        return res.status(400).json({error: 'Invalid query...', details: JSON.stringify(parsed.error)})
    }

    const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);
    try {
        const data = await db.select().from(matches).orderBy((desc(matches.createdAt))).limit(limit)
        res.json({data})
    } catch (e) {
        res.status(500).json({error: 'Failed to list Matches.'})
    }
})

matchRouter.post('/', async (req, res) => {
    const parsed = createMatchSchema.safeParse(req.body)

    if (!parsed.success) {
        return res.status(400).json({error: 'Invalid payload', details: JSON.stringify(parsed.error)})
    }

    try {
        const status = getMatchStatus(parsed.data.startTime, parsed.data.endTime);
        if (!status) {
            return res.status(400).json({error: 'Could not determine match status from provided times.'});
        }
        const [event] = await db.insert(matches).values({
            ...parsed.data,
            startTime: new Date(parsed.data.startTime),
            endTime: new Date(parsed.data.endTime),
            homeScore: parsed.data.homeScore,
            awayScore: parsed.data.awayScore,
            status
        }).returning();

        res.status(201).json({data: event})
    } catch (e) {
        console.error('Failed to create match:', e);
        res.status(500).json({error: 'Failed to create match.'})
    }
})