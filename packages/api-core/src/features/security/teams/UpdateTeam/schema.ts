import { z } from "zod";

export const updateTeamValidation = z.object({
    name: z.string().min(3).optional(),
    description: z.string().max(500).optional(),
    groups: z.array(z.string()).optional()
});
