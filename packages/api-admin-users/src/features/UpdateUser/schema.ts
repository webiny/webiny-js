import { z } from "zod";

export const updateUserValidation = z.object({
    displayName: z.string().min(1).optional(),
    avatar: z.object({
        id: z.string().min(1),
        src: z.string().url(),
    }).optional().nullable(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    group: z.string().optional(),
    team: z.string().optional()
});
