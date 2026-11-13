import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

/**
 * Reading audit logs requires full access or the `al.*` permission.
 */
export const canAccessAuditLogs = async (
    identityContext: IdentityContext.Interface
): Promise<boolean> => {
    const permissions = await identityContext.getPermissions("al.*");

    return permissions.length > 0;
};
