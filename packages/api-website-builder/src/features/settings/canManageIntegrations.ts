import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

/**
 * Integrations hold third-party credentials. Access needs an explicit grant: full access, an
 * unrestricted `wb.*`, or the `wb.integrations` permission. A restricted wildcard such as
 * `{ name: "wb.*", rwd: "r" }` (the frontend API key, read-only roles) must not grant it.
 */
export const canManageIntegrations = async (
    identityContext: IdentityContext.Interface
): Promise<boolean> => {
    if (await identityContext.hasFullAccess()) {
        return true;
    }

    const wildcard = await identityContext.getPermission("wb.*");
    if (wildcard && Object.keys(wildcard).every(key => key === "name")) {
        return true;
    }

    const permissions = await identityContext.getPermissions("wb.integrations");
    return permissions.some(permission => permission.name === "wb.integrations");
};
