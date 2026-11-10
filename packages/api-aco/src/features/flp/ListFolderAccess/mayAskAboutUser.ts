import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";

/** About oneself, always; about others, with full access (or authorization turned off). */
export const mayAskAboutUser = async (
    identityContext: IdentityContext.Interface,
    userId: string
): Promise<boolean> => {
    if (!identityContext.isAuthorizationEnabled()) {
        return true;
    }
    if (identityContext.getIdentity()?.id === userId) {
        return true;
    }
    const permissions = await identityContext.listPermissions();
    return permissions.some(permission => permission.name === "*");
};
