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
): Promise<TPermission[]> => {
    await context.i18n.checkI18NContentPermission();
    const pbPagePermissions = await context.security.getPermissions<TPermission>(name);

    const relevantPbPagePermissions = pbPagePermissions.filter(current => {
        if (check.rwd && !hasRwd(current, check.rwd)) {
            return false;
        }

        if (check.pw && !hasPw<TPermission>(current, check.pw)) {
            return false;
        }

        return true;
    });

    if (relevantPbPagePermissions.length === 0) {
        throw new NotAuthorizedError();
    }

    return relevantPbPagePermissions;
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
