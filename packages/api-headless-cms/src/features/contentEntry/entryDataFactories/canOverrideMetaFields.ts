import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { AccessControl } from "~/features/shared/abstractions.js";
import type { CmsModel } from "~/types/index.js";

interface ICanOverrideMetaFieldsParams {
    identityContext: IdentityContext.Interface;
    accessControl: AccessControl.Interface;
    model: CmsModel;
}

/**
 * Security: meta fields (createdBy, savedBy, modifiedOn, ...) decide entry ownership, so an
 * identity limited to its own entries must not be able to set them (e.g. take over an entry by
 * changing createdBy). Only code running without authorization (imports, migrations), full access
 * identities and identities which can already write all entries of the model may override them.
 */
export const canOverrideMetaFields = async (
    params: ICanOverrideMetaFieldsParams
): Promise<boolean> => {
    const { identityContext, accessControl, model } = params;
    if (!identityContext.isAuthorizationEnabled()) {
        return true;
    }
    if (await identityContext.hasFullAccess()) {
        return true;
    }
    return accessControl.canWriteNonOwnedEntries({ model });
};
