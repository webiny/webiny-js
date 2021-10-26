import { PbContext, PbSecurityPermission } from "../../../types";
import { NotAuthorizedError } from "@webiny/api-security";
import hasRwd from "./hasRwd";

export default async <TPermission extends PbSecurityPermission = PbSecurityPermission>(
    context: PbContext,
    name: string,
    check: { rwd?: string; pw?: string }
): Promise<TPermission> => {
    await context.i18nContent.checkI18NContentPermission();
    const pbPagePermission = await context.security.getPermission<TPermission>(name);
    if (!pbPagePermission) {
        throw new NotAuthorizedError();
    }

    if (check.rwd && !hasRwd(pbPagePermission, check.rwd)) {
        throw new NotAuthorizedError();
    }

    if (check.pw && !hasPw<TPermission>(pbPagePermission, check.pw)) {
        throw new NotAuthorizedError();
    }

    return pbPagePermission;
};

// Has publishing workflow permissions?
const hasPw = <TPermission = Record<string, any>>(permission: TPermission, pw: string) => {
    const isCustom = Object.keys(permission).length > 1; // "name" key is always present

    if (!isCustom) {
        // Means it's a "full-access" permission.
        return true;
    }

    if (typeof permission["pw"] !== "string") {
        return false;
    }

    return permission["pw"].includes(pw);
};
