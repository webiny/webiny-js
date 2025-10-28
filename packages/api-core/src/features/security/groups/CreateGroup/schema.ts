import { z } from "zod";

export const createGroupValidation = z.object({
    name: z.string().min(3),
    slug: z.string().min(3),
    description: z.string().max(500).optional().default(""),
    permissions: z.array(z.object({ name: z.string() }).passthrough())
});
