import { z } from "zod";

export const createTeamValidation = z.object({
    name: z.string().min(3),
    slug: z.string().min(3),
    description: z.string().max(500).optional().default(""),
    roles: z.array(z.string())
});
