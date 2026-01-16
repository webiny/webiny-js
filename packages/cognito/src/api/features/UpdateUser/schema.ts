import { z } from "zod";

export const updateAdminUserValidation = z.object({
    displayName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    password: z.string().min(8).optional(),
    avatar: z
        .object({
            id: z.string().min(1),
            src: z.string().url()
        })
        .optional()
        .nullable(),
    roles: z.array(z.string()).optional(),
    teams: z.array(z.string()).optional()
});
