import { NotAuthorizedError } from "@webiny/api-security";
import { FbForm, FbFormPermission, FbFormSettingsPermission, FormBuilderContext } from "~/types";

export const checkBaseFormPermissions = async (
    context: FormBuilderContext,
    check: { rwd?: string; pw?: string } = {}
): Promise<FbFormPermission> => {
    await context.i18n.checkI18NContentPermission();
    const permission = await context.security.getPermission<FbFormPermission>("fb.form");
    if (!permission) {
        throw new NotAuthorizedError();
    }

    if (check.rwd && !hasRwd(permission, check.rwd)) {
        throw new NotAuthorizedError();
    }

    if (check.pw && !hasPW(permission, check.pw)) {
        throw new NotAuthorizedError();
    }

    return permission;
};

export const checkBaseSettingsPermissions = async (
    context: FormBuilderContext
): Promise<FbFormSettingsPermission> => {
    const permission = await context.security.getPermission<FbFormSettingsPermission>(
        "fb.settings"
    );
    if (!permission) {
        throw new NotAuthorizedError();
    }

    return permission;
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
export const hasRwd = (permission: FbFormPermission, rwd: string) => {
    if (typeof permission.rwd !== "string") {
        return true;
    }

    return permission.rwd.includes(rwd);
};

/**
 * Has publishing workflow permissions?
 */
export const hasPW = (permission: FbFormPermission, pw: string) => {
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

export const checkOwnership = (
    form: FbForm,
    permission: FbFormPermission,
    context: FormBuilderContext
) => {
    if (permission.own === true) {
        const identity = context.security.getIdentity();
        if (form.ownedBy.id !== identity.id) {
            throw new NotAuthorizedError();
        }
    }
};
