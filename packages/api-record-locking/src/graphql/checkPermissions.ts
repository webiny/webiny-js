import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared";
import type { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import type { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";

const CMS_TYPE_PREFIX = "cms#";

/**
 * Record locking is used by admin users while editing. Anonymous callers and API keys
 * (e.g. the public website key) can't lock entries or list locks.
 */
export const checkPermissions = (identityContext: IdentityContext.Interface): void => {
    const identity = identityContext.getIdentity();

    if (identity.isAnonymous() || !identity.isAdmin()) {
        throw new NotAuthorizedError();
    }
};

/**
 * Listing every lock record reveals who is editing what across all models: it requires full
 * access or the record locking permission.
 */
export const checkListAllPermissions = async (
    identityContext: IdentityContext.Interface
): Promise<void> => {
    checkPermissions(identityContext);

    if (await identityContext.hasFullAccess()) {
        return;
    }
    if (!(await identityContext.getPermission("recordLocking"))) {
        throw new NotAuthorizedError();
    }
};

export interface ILockTypeAccessParams {
    identityContext: IdentityContext.Interface;
    getModel: GetModelUseCase.Interface;
    accessControl: AccessControl.Interface;
}

/**
 * Lock record types are CMS models: the admin app sends the bare `modelId`, `cms#<modelId>` is also
 * accepted. Returns a function telling whether the current identity can read entries of the model
 * a type points to. Types that don't resolve to a model are refused.
 */
export const createLockTypeAccess = async (
    params: ILockTypeAccessParams
): Promise<(type: string) => Promise<boolean>> => {
    const { identityContext, getModel, accessControl } = params;
    if (!identityContext.isAuthorizationEnabled() || (await identityContext.hasFullAccess())) {
        return async () => true;
    }
    const cache = new Map<string, Promise<boolean>>();

    const canAccess = async (type: string): Promise<boolean> => {
        const modelId = type.startsWith(CMS_TYPE_PREFIX)
            ? type.slice(CMS_TYPE_PREFIX.length)
            : type;
        if (!modelId) {
            return false;
        }
        // The model is loaded without authorization only to evaluate access to its entries.
        const modelResult = await identityContext.withoutAuthorization(() => {
            return getModel.execute(modelId);
        });
        if (modelResult.isFail()) {
            return false;
        }
        return accessControl.canAccessEntry({ model: modelResult.value, rwd: "r" });
    };

    return (type: string) => {
        let result = cache.get(type);
        if (!result) {
            result = canAccess(type);
            cache.set(type, result);
        }
        return result;
    };
};

/**
 * Security: locking or requesting an unlock requires read access to the entries of the model.
 */
export const checkTypePermissions = async (
    params: ILockTypeAccessParams,
    type: string
): Promise<void> => {
    checkPermissions(params.identityContext);

    const canAccessType = await createLockTypeAccess(params);
    if (!(await canAccessType(type))) {
        throw new NotAuthorizedError();
    }
};
