import { NotAuthorizedError } from "@webiny/api-security";
import { AcoContext } from "~/types";

/**
 * Unlike `ensureAuthentication`, this allows any authenticated identity (e.g., API keys).
 * Use it only for read operations which are safe to expose to non-admin identities.
 */
export const ensureIdentity = (context: AcoContext) => {
    const identity = context.security.getIdentity();
    if (!identity) {
        throw new NotAuthorizedError();
    }
};
