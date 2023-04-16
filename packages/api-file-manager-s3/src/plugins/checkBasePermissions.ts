import { NotAuthorizedError } from "@webiny/api-security";
import { GetPermission } from "@webiny/api-security/types";
import { FilePermission } from "@webiny/api-file-manager/types";

export const checkBasePermissions = async (
    getPermission: GetPermission,
    check: { rwd?: string } = {}
): Promise<FilePermission> => {
    const filePermission = await getPermission<FilePermission>("fm.file");

    if (!filePermission) {
        throw new NotAuthorizedError();
    }
    if (check.rwd && !hasRwd(filePermission, check.rwd)) {
        throw new NotAuthorizedError();
    }

    return filePermission;
};

const hasRwd = (filesFilePermission: FilePermission, rwd: string): boolean => {
    if (typeof filesFilePermission.rwd !== "string") {
        return true;
    }

    return filesFilePermission.rwd.includes(rwd);
};
