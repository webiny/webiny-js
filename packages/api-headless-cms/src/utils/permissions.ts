import { BaseCmsSecurityPermission, CmsContext, CmsEntryPermission } from "~/types";
import { NotAuthorizedError } from "@webiny/api-security";

export const hasRwd = (permission: BaseCmsSecurityPermission, rwd: string): boolean => {
    if (typeof permission.rwd !== "string") {
        return true;
    }

    return permission.rwd.includes(rwd);
};

export const hasPw = (permission: CmsEntryPermission, pw: string): boolean => {
    const isCustom = Object.keys(permission).length > 1; // "name" key is always present

    if (!isCustom) {
        // Means it's a "full-access" permission.
        return true;
    }

    if (typeof permission.pw !== "string") {
        return false;
    }

    return permission.pw.includes(pw);
};

const PW: Record<string, string> = {
    r: "request review",
    c: "request change",
    p: "publish",
    u: "unpublish"
};

const RWD: Record<string, string> = {
    r: "read",
    w: "write",
    d: "delete"
};

export const checkPermissions = async <
    TPermission extends BaseCmsSecurityPermission = BaseCmsSecurityPermission
>(
    context: CmsContext,
    name: string,
    check?: { rwd?: string; pw?: string }
): Promise<TPermission> => {
    // Check if user is allowed to edit content in current language
    const contentPermission = await context.security.getPermission("content.i18n");

    if (!contentPermission) {
        throw new NotAuthorizedError({
            data: {
                reason: "Missing access to content in any locale."
            }
        });
    }

    // We need to check this manually as CMS locale comes from the URL and not the default i18n app.
    const code = context.cms.getLocale().code;

    const locales: string[] = contentPermission.locales;

    // IMPORTANT: If we have a `contentPermission`, and `locales` key is NOT SET - it means the user has access to all locales.
    // However, if the the `locales` IS SET - check that it contains the required locale.
    if (Array.isArray(locales) && !locales.includes(code)) {
        throw new NotAuthorizedError({
            data: {
                reason: `Not allowed to access content in "${code}."`
            }
        });
    }

    const permission = await context.security.getPermission<TPermission>(name);

    if (!permission) {
        throw new NotAuthorizedError({
            data: {
                reason: `Missing permission "${name}".`
            }
        });
    }

    if (!check) {
        return permission;
    }

    if (check.rwd && !hasRwd(permission, check.rwd)) {
        throw new NotAuthorizedError({
            data: {
                reason: `Not allowed to perform "${RWD[check.rwd]}" on "${name}".`
            }
        });
    }

    // r = request review
    // c = request change
    // p = publish
    // u = unpublish
    if (check.pw && !hasPw(permission, check.pw)) {
        throw new NotAuthorizedError({
            data: {
                reason: `Not allowed to perform "${PW[check.pw]}" on "${name}".`
            }
        });
    }

    return permission;
};
