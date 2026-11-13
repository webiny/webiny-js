import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";

/**
 * Record locking is used by admin users while editing. Anonymous callers and API keys
 * (e.g. the public website key) can't lock entries or list locks.
 */
export const checkPermissions = async (context: ApiCoreContext): Promise<void> => {
    const identityContext = context.container.resolve(IdentityContext);
    const identity = identityContext.getIdentity();

    if (identity.isAnonymous() || !identity.isAdmin()) {
        throw new NotAuthorizedError();
    }
};

/**
 * Listing every lock record reveals who is editing what across all models: it requires full
 * access or the record locking permission.
 */
export const checkListAllPermissions = async (context: ApiCoreContext): Promise<void> => {
    await checkPermissions(context);

    const identityContext = context.container.resolve(IdentityContext);
    if (await identityContext.hasFullAccess()) {
        return;
    }
    if (!(await identityContext.getPermission("recordLocking"))) {
        throw new NotAuthorizedError();
    }
};
