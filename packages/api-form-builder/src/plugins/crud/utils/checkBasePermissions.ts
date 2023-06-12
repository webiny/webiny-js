import { NotAuthorizedError } from "@webiny/api-security";
import { FbFormPermission, FormBuilderContext } from "~/types";

export const checkBaseFormPermissions = async (
    context: FormBuilderContext,
    check: { rwd?: string; pw?: string } = {}
): Promise<FbFormPermission[]> => {
    const fbFormPermissions = await context.security.getPermissions<FbFormPermission>("fb.form");
    const relevantPbPagePermissions = fbFormPermissions.filter(current => {
        if (check.rwd && !hasRwd(current, check.rwd)) {
            return false;
        }

        if (check.pw && !hasPw(current, check.pw)) {
            return false;
        }

        return true;
    });

    if (relevantPbPagePermissions.length === 0) {
        throw new NotAuthorizedError();
    }

    return relevantPbPagePermissions;
};

export const getStatus = (params: { published: boolean; locked: boolean }) => {
    if (params.published) {
        return "published";
    }

    return params.locked ? "locked" : "draft";
};

/**
 * Has read/write/delete permissions?
 */
export const hasRwd = (permissions: FbFormPermission | FbFormPermission[], rwd?: string) => {
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
        return permission.rwd && permission.rwd.includes(rwd);
    });
};

/**
 * Has publishing workflow permissions?
 */
export const hasPw = (permission: FbFormPermission, pw: string) => {
    /**
     * "name" key is always present
     */
    const isCustom = Object.keys(permission).length > 1;

    if (!isCustom) {
        /**
         * Means it's a "full-access" permission.
         */
        return true;
    }

    if (typeof permission.pw !== "string") {
        return false;
    }

    return permission.pw.includes(pw);
};
