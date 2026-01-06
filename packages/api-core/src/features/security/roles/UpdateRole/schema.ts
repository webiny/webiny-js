import { z } from "zod";

export const updateRoleValidation = z.object({
    name: z.string().min(3).optional(),
    description: z.string().max(500).optional(),
    permissions: z.array(z.object({ name: z.string() }).passthrough()).optional()
});
