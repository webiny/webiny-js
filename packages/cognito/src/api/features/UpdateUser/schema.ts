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
    teams: z.array(z.string()).optional(),
    // Bounds match the admin dashboard (2 to 4 columns), and keep the stored JSON small.
    dashboardLayout: z
        .object({
            columns: z.array(z.array(z.string().max(200)).max(100)).max(4),
            hidden: z.array(z.string().max(200)).max(200),
            columnCount: z.number().int().min(2).max(4)
        })
        .optional()
        .nullable()
});
