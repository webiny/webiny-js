import { NotAuthorizedError } from "@webiny/api-headless-cms/utils/errors.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

/**
 * Throws unless the current identity has the given permission.
 */
export const ensurePermission = async (context: ApiCoreContext, name: string): Promise<void> => {
    const identityContext = context.container.resolve(IdentityContext);
    const permission = await identityContext.getPermission(name);

    if (!permission) {
        throw new NotAuthorizedError();
    }
};
