import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

/**
 * Simple permission check. Only authenticated users can access the websockets API via GraphQL
 */
export const checkPermissions = async (context: ApiCoreContext): Promise<void> => {
    const identityContext = context.container.resolve(IdentityContext);
    const identity = identityContext.getIdentity();

    if (identity.isAnonymous()) {
        throw new NotAuthorizedError();
    }
};
