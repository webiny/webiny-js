import { z } from "zod";
import { ADMIN_EXTENSION_KINDS } from "~/shared/adminExtensions/constants.js";

export const CreateAdminExtensionInputSchema = z.object({
    kind: z.enum(ADMIN_EXTENSION_KINDS),
    // Lowercase and dashes, because the name is what fields and menus are registered under.
    name: z
        .string()
        .max(64)
        .regex(
            /^[a-z][a-z0-9-]*$/,
            "Use lowercase letters, digits and dashes, starting with a letter."
        ),
    label: z.string().trim().min(1).max(128),
    description: z.string().max(1024).optional(),
    source: z.string().min(1)
});
