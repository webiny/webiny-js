import type { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

interface RecordLockingSecurityPermission extends SecurityPermission {
    canForceUnlock?: boolean;
}

export const hasFullAccessPermission = async (
    identityContext: IdentityContext.Interface
): Promise<boolean> => {
    const hasFullAccess = await identityContext.hasFullAccess();
    if (hasFullAccess) {
        return true;
    }

    const permission =
        await identityContext.getPermission<RecordLockingSecurityPermission>("recordLocking");
    return permission?.canForceUnlock === true;
};
