import { NotAuthorizedError } from "@webiny/api-headless-cms/utils/errors.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

interface Options {
    permission: string;
}

export const ensureAuthentication = (context: ApiCoreContext, options?: Options) => {
    const identityContext = context.container.resolve(IdentityContext);
    const identity = identityContext.getIdentity();
    if (identity.isAnonymous()) {
        throw new NotAuthorizedError();
    }

    if (options?.permission && !identityContext.getPermission(options.permission)) {
        throw new NotAuthorizedError();
    }
};
