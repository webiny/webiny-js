import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/index.js";

export interface IEnsureCanTriggerSystemTaskParams {
    identityContext: IdentityContext.Interface;
    tenantContext: TenantContext.Interface;
}

/**
 * Security: these tasks run without authorization and act on the indexes of all tenants.
 * Only a full-access identity in the root tenant may trigger them.
 * Code that triggers them with authorization disabled is trusted.
 *
 * @throws NotAuthorizedError
 */
export const ensureCanTriggerSystemTask = async (
    params: IEnsureCanTriggerSystemTaskParams
): Promise<void> => {
    const { identityContext, tenantContext } = params;
    if (!identityContext.isAuthorizationEnabled()) {
        return;
    }
    if (tenantContext.getTenant()?.id !== "root") {
        throw new NotAuthorizedError();
    }
    if (!(await identityContext.hasFullAccess())) {
        throw new NotAuthorizedError();
    }
};
