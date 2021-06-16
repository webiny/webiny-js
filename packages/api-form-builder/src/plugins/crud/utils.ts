import { NotAuthorizedError } from "@webiny/api-security";
import {
    FbForm,
    FbFormPermission,
    FbFormSettingsPermission,
    FormBuilderContext
} from "../../types";

export const checkBaseFormPermissions = async (
    context: FormBuilderContext,
    check: { rwd?: string; pw?: string } = {}
): Promise<FbFormPermission> => {
    await context.i18nContent.checkI18NContentPermission();
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

export const getFormId = (form: FbForm) => {
    if (form.id.includes("#")) {
        return `${form.id.split("#")[0]}#${form.version}`;
    }
    return `${form.id}#${form.version}`;
};

export const getStatus = (params: { published: boolean; locked: boolean }) => {
    if (params.published) {
        return "published";
    }

    return params.locked ? "locked" : "draft";
};

// Has read/write/delete permissions?
export const hasRwd = (permission: FbFormPermission, rwd: string) => {
    if (typeof permission.rwd !== "string") {
        return true;
    }

    return permission.rwd.includes(rwd);
};

// Has publishing workflow permissions?
export const hasPW = (permission: FbFormPermission, pw: string) => {
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

export const normalizeSortInput = (sort: Record<string, number>) => {
    const [[key, value]] = Object.entries(sort);

    const shouldUseKeyword = ["name"];

    if (shouldUseKeyword.includes(key)) {
        return {
            [`${key}.keyword`]: {
                order: value === -1 ? "desc" : "asc"
            }
        };
    }

    return {
        [key]: {
            order: value === -1 ? "desc" : "asc"
        }
    };
};

export const getPKPrefix = (context: FormBuilderContext) => {
    const { tenancy, i18nContent } = context;
    if (!tenancy.getCurrentTenant()) {
        throw new Error("Tenant missing.");
    }

    if (!i18nContent.getLocale()) {
        throw new Error("Locale missing.");
    }

    return `T#${tenancy.getCurrentTenant().id}#L#${i18nContent.getLocale().code}#FB#`;
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

export const encodeCursor = cursor => {
    if (!cursor) {
        return null;
    }

    return Buffer.from(JSON.stringify(cursor)).toString("base64");
};

export const decodeCursor = cursor => {
    if (!cursor) {
        return null;
    }

    return JSON.parse(Buffer.from(cursor, "base64").toString("ascii"));
};

export const paginateBatch = async <T = Record<string, any>>(
    items: T[],
    perPage: number,
    execute: (items: T[]) => Promise<any>
) => {
    const pages = Math.ceil(items.length / perPage);
    for (let i = 0; i < pages; i++) {
        await execute(items.slice(i * perPage, i * perPage + perPage));
    }
};
