import type { FilePermission } from "@webiny/api-file-manager/types.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/index.js";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";

export const checkPermissions = async (
    identityContext: IdentityContext.Interface,
    check: { rwd?: string } = {}
) => {
    const filePermissions = await identityContext.getPermissions<FilePermission>("fm.file");

    const relevantFilePermissions = filePermissions.filter(current => {
        if (check.rwd && !hasRwd(current, check.rwd)) {
            return false;
        }

        return true;
    });

    if (relevantFilePermissions.length === 0) {
        throw new NotAuthorizedError();
    }

    return relevantFilePermissions;
};

const hasRwd = (filesFilePermissions: FilePermission | FilePermission[], rwd: string): boolean => {
    if (!Array.isArray(filesFilePermissions)) {
        filesFilePermissions = [filesFilePermissions];
    }

    if (!rwd) {
        return true;
    }

    // Is there a permission that doesn't restrict RWD permissions, that means all RWD permissions are allowed.
    const permissionWithoutRwdRestrictions = filesFilePermissions.some(permission => {
        return typeof permission.rwd !== "string";
    });

    if (permissionWithoutRwdRestrictions) {
        return true;
    }

    // If there is no permission that doesn't restrict RWD permissions, that means we need to check if the RWD.
    return filesFilePermissions.some(permission => {
        return permission.rwd && permission.rwd.includes(rwd);
    });
};
