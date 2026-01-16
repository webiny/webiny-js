import { z } from "zod";

export const createAdminUserValidation = z.object({
    id: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    password: z.string().min(8),
    avatar: z
        .object({
            id: z.string().min(1),
            src: z.string().url()
        })
        .optional()
        .nullable(),
    roles: z.array(z.string()).optional().default([]),
    teams: z.array(z.string()).optional().default([])
});
