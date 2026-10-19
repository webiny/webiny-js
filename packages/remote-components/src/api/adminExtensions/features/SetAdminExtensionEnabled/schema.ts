import { z } from "zod";

export const SetAdminExtensionEnabledInputSchema = z.object({
    id: z.string().min(1, "Admin extension ID is required."),
    enabled: z.boolean()
});
