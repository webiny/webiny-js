import { NotAuthorizedError } from "@webiny/api-headless-cms/utils/errors.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

/**
 * Rejects anonymous callers at the schema boundary. Entity-level authorization lives in the use
 * cases, not here — this only establishes that somebody is signed in.
 */
export const ensureAuthentication = (context: ApiCoreContext) => {
    const identityContext = context.container.resolve(IdentityContext);

    if (identityContext.getIdentity().isAnonymous()) {
        throw new NotAuthorizedError();
    }
};
