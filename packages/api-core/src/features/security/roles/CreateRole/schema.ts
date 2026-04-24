import { z } from "zod";

export const createRoleValidation = z.object({
    name: z.string().min(3),
    slug: z.string().min(3),
    description: z.string().max(500).optional().default(""),
    permissions: z.array(z.looseObject({ name: z.string() }))
});
