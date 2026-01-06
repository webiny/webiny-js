import { z } from "zod";

export const updateUserValidation = z.object({
    displayName: z.string().min(1).optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    avatar: z
        .object({
            id: z.string().min(1),
            src: z.string().url()
        })
        .optional()
        .nullable(),
    roles: z.array(z.string()).optional(),
    teams: z.array(z.string()).optional(),
    password: z.string().optional()
});
