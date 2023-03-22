import { FileManagerContext, FilePermission } from "@webiny/api-file-manager/types";
import { NotAuthorizedError } from "@webiny/api-security";

export const checkPermission = async (
    context: FileManagerContext,
    check: { rwd?: string } = {}
) => {
    await context.i18n.checkI18NContentPermission();

    const filePermission = await context.security.getPermission<FilePermission>("fm.file");

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
