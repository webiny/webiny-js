import { z } from "zod";

export const createUserValidation = z.object({
    id: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    // We did not use an e-mail validator here, just because external
    // IdPs (Okta, Auth0) do not require e-mail to be present. When creating
    // admin users, they're actually passing the user's ID as the e-mail.
    // For example: packages/api-security-okta/src/createAdminUsersHooks.ts:13
    // In the future, we might want to rename this field to `idpId` or similar.
    email: z.string(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    avatar: z
        .object({
            id: z.string().min(1),
            src: z.string().url()
        })
        .optional()
        .nullable(),
    roles: z.array(z.string()).optional().default([]),
    teams: z.array(z.string()).optional().default([]),
    external: z.boolean().optional().default(false)
});
