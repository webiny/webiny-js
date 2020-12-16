import { PbContext } from "@webiny/api-page-builder/types";
import { NotAuthorizedError } from "@webiny/api-security";
import hasRwd from "./hasRwd";
import hasRcpu from "./hasRcpu";

export default async <TPermission = Record<string, any>>(
    context: PbContext,
    name: string,
    check: { rwd?: string; rcpu?: string }
): Promise<TPermission> => {
    await context.i18nContent.checkI18NContentPermission();
    const pbPagePermission = await context.security.getPermission<TPermission>(name);
    if (!pbPagePermission) {
        throw new NotAuthorizedError();
    }

    if (check.rwd && !hasRwd(pbPagePermission, check.rwd)) {
        throw new NotAuthorizedError();
    }

    if (check.rcpu && !hasRcpu(pbPagePermission, check.rcpu)) {
        throw new NotAuthorizedError();
    }

    return pbPagePermission;
};
