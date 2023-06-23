import { FileManagerContext, FilePermission } from "@webiny/api-file-manager/types";
import { NotAuthorizedError } from "@webiny/api-security";

export const checkPermissions = async (
    context: FileManagerContext,
    check: { rwd?: string } = {}
) => {
    const filePermissions = await context.security.getPermissions<FilePermission>("fm.file");

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
