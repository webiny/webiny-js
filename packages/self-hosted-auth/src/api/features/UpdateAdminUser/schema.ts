import { z } from "zod";
import { passwordPolicy } from "~/api/domain/passwordPolicy.js";

/*
 * The edit and Account forms send the bound field even when it was typed in and cleared, and a
 * GraphQL client may send `null`. Both mean "keep the current password", which `syncCredential`
 * already assumes, so they become `undefined` before the policy sees them.
 */
const toUndefinedIfEmpty = (value: unknown) => {
    if (value === "" || value === null) {
        return undefined;
    }
    return value;
};

export const updateAdminUserValidation = z.object({
    displayName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    password: z.preprocess(toUndefinedIfEmpty, passwordPolicy.optional()),
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
