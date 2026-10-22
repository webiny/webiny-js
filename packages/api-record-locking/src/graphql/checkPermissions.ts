import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared";

/**
 * Simple permission check. Only authenticated users can access the record locking API via GraphQL.
 */
export const checkPermissions = (identityContext: IdentityContext.Interface): void => {
    const identity = identityContext.getIdentity();

    if (identity.isAnonymous()) {
        throw new NotAuthorizedError();
    }
};
