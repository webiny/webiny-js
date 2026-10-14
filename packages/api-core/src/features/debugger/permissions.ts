import type { IdentityContext } from "~/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "~/types/security.js";

export const DEBUG_PERMISSION = "dev-tools.debug";

/**
 * Whether an identity may capture debug data.
 *
 * Deliberately an exact match rather than `canAccess`, which grants on `*` and on `dev-tools.*`.
 * Capture runs automatically for whoever holds this, so a wildcard would leave it permanently on for
 * every full-access administrator - collecting record content on every request, indefinitely, for
 * people who never asked for it.
 *
 * The consequence, which is intended: full access is not enough. The entity has to be granted
 * deliberately, and that act is the opt-in.
 */
export const canCaptureDebugData = async (
    identityContext: IdentityContext.Interface
): Promise<boolean> => {
    const permissions = await identityContext.listPermissions();
    return permissions.some(
        (permission: SecurityPermission) => permission.name === DEBUG_PERMISSION
    );
};
