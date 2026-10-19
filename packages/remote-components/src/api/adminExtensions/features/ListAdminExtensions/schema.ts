import { z } from "zod";
import { ADMIN_EXTENSION_KINDS } from "~/shared/adminExtensions/constants.js";

export const ListAdminExtensionsInputSchema = z.object({
    kind: z.enum(ADMIN_EXTENSION_KINDS).optional(),
    enabled: z.boolean().optional()
});
