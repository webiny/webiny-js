import { PbContext, PbSecurityPermission } from "../../../types";
import { NotAuthorizedError } from "@webiny/api-security";
import hasRwd from "./hasRwd";

interface Check {
    rwd?: string;
    pw?: string;
}
export default async <TPermission extends PbSecurityPermission = PbSecurityPermission>(
    context: PbContext,
    name: string,
    check: Check
): Promise<TPermission> => {
    await context.i18n.checkI18NContentPermission();
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
const hasPw = <TPermission extends PbSecurityPermission = PbSecurityPermission>(
    permission: TPermission,
    pw: string
): boolean => {
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
