import slugify from "slugify";
import { CmsContentModelPermission, CmsContentModel, CmsContext, CreatedBy } from "./types";
import { NotAuthorizedError } from "@webiny/api-security";
import { SecurityPermission } from "@webiny/api-security/types";

export const defaults = {
    db: {
        table: process.env.DB_TABLE_HEADLESS_CMS,
        keys: [
            {
                primary: true,
                unique: true,
                name: "primary",
                fields: [{ name: "PK" }, { name: "SK" }]
            }
        ]
    },
    es(context: CmsContext) {
        const tenant = context.security.getTenant();
        if (!tenant) {
            throw new Error(`There is no tenant on "context.security".`);
        }
        return {
            index: `${tenant.id}-headless-cms`
        };
    }
};

export const hasRwd = (permission, rwd) => {
    if (typeof permission.rwd !== "string") {
        return true;
    }

    return permission.rwd.includes(rwd);
};

export const hasPw = (permission, pw) => {
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

const PW = {
    r: "request review",
    c: "request change",
    p: "publish",
    u: "unpublish"
};

const RWD = {
    r: "read",
    w: "write",
    d: "delete"
};

export const checkPermissions = async <TPermission = SecurityPermission>(
    context: CmsContext,
    name: string,
    check?: { rwd?: string; pw?: string }
): Promise<TPermission> => {
    // Check if user is allowed to edit content in current language
    const contentPermission: any = await context.security.getPermission("content.i18n");

    if (!contentPermission) {
        throw new NotAuthorizedError({
            data: {
                reason: "Missing access to content in any locale."
            }
        });
    }

    // We need to check this manually as CMS locale comes from the URL and not the default i18n app.
    const code = context.cms.getLocale().code;

    // IMPORTANT: If we have a `contentPermission`, and `locales` key is NOT SET - it means the user has access to all locales.
    // However, if the the `locales` IS SET - check that it contains the required locale.
    if (Array.isArray(contentPermission.locales) && !contentPermission.locales.includes(code)) {
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

export const checkOwnership = (
    context: CmsContext,
    permission: SecurityPermission,
    record: { createdBy?: CreatedBy; ownedBy?: CreatedBy },
    field = "createdBy"
): void => {
    if (!permission.own) {
        return;
    }

    const identity = context.security.getIdentity();

    if (!identity || record[field].id !== identity.id) {
        throw new NotAuthorizedError({
            data: {
                reason: `You are not the owner of the record.`
            }
        });
    }
};

export const validateOwnership = (
    context: CmsContext,
    permission: SecurityPermission,
    record: { createdBy?: CreatedBy; ownedBy?: CreatedBy },
    field = "createdBy"
): boolean => {
    try {
        checkOwnership(context, permission, record, field);
        return true;
    } catch {
        return false;
    }
};
/**
 * model access is checking for both specific model or group access
 * if permission has specific models set as access pattern then groups will not matter (although both can be set)
 */
export const checkModelAccess = (
    context: CmsContext,
    permission: SecurityPermission<CmsContentModelPermission>,
    model: CmsContentModel
): void => {
    if (validateModelAccess(context, permission, model)) {
        return;
    }
    throw new NotAuthorizedError({
        data: {
            reason: `Not allowed to access model "${model.modelId}".`
        }
    });
};
export const validateModelAccess = (
    context: CmsContext,
    permission: SecurityPermission<CmsContentModelPermission>,
    model: CmsContentModel
): boolean => {
    const { models, groups } = permission;
    // when no models or groups defined on permission
    // it means user has access to everything
    if (!models && !groups) {
        return true;
    }
    const locale = context.cms.getLocale().code;
    // when there is no locale in models or groups, it means that no access was given
    // this happens when access control was set but no models or groups were added
    if (models) {
        if (
            Array.isArray(models[locale]) === false ||
            models[locale].includes(model.modelId) === false
        ) {
            return false;
        }
        return true;
    }
    if (
        Array.isArray(groups[locale]) === false ||
        groups[locale].includes(model.group.id) === false
    ) {
        return false;
    }
    return true;
};

export const toSlug = text => {
    return slugify(text, {
        replacement: "-",
        lower: true,
        remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g
    });
};

export const encodeElasticsearchCursor = (cursor?: any) => {
    if (!cursor) {
        return null;
    }

    return Buffer.from(JSON.stringify(cursor)).toString("base64");
};

export const decodeElasticsearchCursor = (cursor?: string) => {
    if (!cursor) {
        return null;
    }

    return JSON.parse(Buffer.from(cursor, "base64").toString("ascii"));
};

export const zeroPad = version => `${version}`.padStart(4, "0");

export const createCmsPK = (context: CmsContext) => {
    const { security, cms } = context;

    const tenant = security.getTenant();
    if (!tenant) {
        throw new Error("Tenant missing.");
    }

    const locale = cms.getLocale();
    if (!locale) {
        throw new Error("Locale missing.");
    }

    return `T#${tenant.id}#L#${locale.code}#CMS`;
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
