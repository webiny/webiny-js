import { CmsContext, BaseCmsSecurityPermission } from "~/types";
import { NotAuthorizedError } from "@webiny/api-security";

interface Check {
    rwd?: string;
    pw?: string;
}

const PW: Record<string, string> = {
    p: "publish",
    u: "unpublish"
};

const RWD: Record<string, string> = {
    r: "read",
    w: "write",
    d: "delete"
};

export const checkPermissions = async <TPermission extends BaseCmsSecurityPermission = BaseCmsSecurityPermission>(
    context: CmsContext,
    name: string,
    check: Check = {}
): Promise<TPermission[]> => {
    const cmsPermissions = await context.security.getPermissions<TPermission>(name);

    // Received contentPermissions are already filtered by the detected locale. So, basically
    // if the array is empty, that means we can't access the content in the current locale.
    // We can be sure that if the array is not empty, the user has access to the content in
    // the current locale.
    if (!cmsPermissions.length) {
        // We need to check this manually as CMS locale comes from the URL and not the default i18n app.
        const code = context.cms.getLocale().code;

        throw new NotAuthorizedError({
            data: {
                reason: `Not allowed to access content in "${code}."`
            }
        });
    }

    const relevantCmsPermissions = cmsPermissions.filter(current => {
        if (check.rwd && !hasRwd<TPermission>(current, check.rwd)) {
            return false;
        }

        if (check.pw && !hasPw<TPermission>(current, check.pw)) {
            return false;
        }

        return true;
    });

    if (relevantCmsPermissions.length === 0) {
        if (check.rwd) {
            throw new NotAuthorizedError({
                data: {
                    reason: `Not allowed to perform "${RWD[check.rwd]}" on "${name}".`
                }
            });
        }

        if (check.pw) {
            throw new NotAuthorizedError({
                data: {
                    reason: `Not allowed to perform "${PW[check.pw]}" on "${name}".`
                }
            });
        }

        throw new NotAuthorizedError({
            data: {
                reason: `Missing permission "${name}".`
            }
        });
    }

    return relevantCmsPermissions;
};

const hasRwd = <TPermission extends BaseCmsSecurityPermission = BaseCmsSecurityPermission>(
    permissions: TPermission | TPermission[],
    rwd?: string
): boolean => {
    if (!Array.isArray(permissions)) {
        permissions = [permissions];
    }

    if (!rwd) {
        return true;
    }

    // Is there a permission that doesn't restrict RWD permissions, that means all RWD permissions are allowed.
    const permissionWithoutRwdRestrictions = permissions.some(permission => {
        return typeof permission.rwd !== "string";
    });

    if (permissionWithoutRwdRestrictions) {
        return true;
    }

    // If there is no permission that doesn't restrict RWD permissions, that means we need to check if the RWD.
    return permissions.some(permission => {
        if (typeof permission.rwd !== "string") {
            return true;
        }

        return permission.rwd && permission.rwd.includes(rwd);
    });
};

const hasPw = <TPermission extends BaseCmsSecurityPermission = BaseCmsSecurityPermission>(
    permissions: TPermission | TPermission[],
    pw?: string
): boolean => {
    if (!Array.isArray(permissions)) {
        permissions = [permissions];
    }

    if (!pw) {
        return true;
    }

    // Is there a permission that doesn't restrict PW permissions, that means all PW permissions are allowed.
    const permissionWithoutPwRestrictions = permissions.some(permission => {
        return typeof permission.pw !== "string";
    });

    if (permissionWithoutPwRestrictions) {
        return true;
    }

    // If there is no permission that doesn't restrict PW permissions, that means we need to check if the PW.
    return permissions.some(permission => {
        const isCustom = Object.keys(permission).length > 1; // "name" key is always present

        if (!isCustom) {
            // Means it's a "full-access" permission.
            return true;
        }

        if (typeof permission.pw !== "string") {
            return false;
        }

        return permission.pw.includes(pw);
    });
};
