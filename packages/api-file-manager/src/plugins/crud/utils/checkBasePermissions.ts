import { FileManagerContext, FilePermission } from "@webiny/api-file-manager/types";
import { NotAuthorizedError } from "@webiny/api-security";

export default async (
    context: FileManagerContext,
    check: { rwd?: string } = {}
): Promise<FilePermission> => {
    await context.i18nContent.checkI18NContentPermission();
    const filePermission = await context.security.getPermission<FilePermission>("fm.file");
    if (!filePermission) {
        throw new NotAuthorizedError();
    }
    if (check.rwd && !hasRwd(filePermission, check.rwd)) {
        throw new NotAuthorizedError();
    }

    return filePermission;
};

const hasRwd = (filesFilePermission, rwd) => {
    if (typeof filesFilePermission.rwd !== "string") {
        return true;
    }

    return filesFilePermission.rwd.includes(rwd);
};
