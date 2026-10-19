import { z } from "zod";

export const DeleteAdminExtensionInputSchema = z.object({
    id: z.string().min(1, "Admin extension ID is required.")
});
