import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

export const ensureAuthentication = (context: ApiCoreContext) => {
    const identityContext = context.container.resolve(IdentityContext);
    const identity = identityContext.getIdentity();

    if (!identity.isAnonymous()) {
        return;
    }
    throw new NotAuthorizedError();
};
