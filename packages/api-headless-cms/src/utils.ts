import slugify from "slugify";
import {
    CmsContentEntryPermissionType,
    CmsContentModelPermissionType,
    CmsContentModelType,
    CmsContext,
    CreatedByType
} from "./types";
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

export const hasRcpu = (permission, rcpu) => {
    if (typeof permission.rcpu !== "string") {
        return true;
    }

    return permission.rcpu.includes(rcpu);
};

export const checkPermissions = async <TPermission = SecurityPermission>(
    context: CmsContext,
    name: string,
    check?: { rwd?: string; rcpu?: string }
): Promise<TPermission> => {
    // Check if user is allowed to edit content in current language
    const contentPermission: any = await context.security.getPermission("content.i18n");

    if (!contentPermission) {
        throw new NotAuthorizedError({
            data: {
                reason: "contentPermission"
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
                reason: `missing locale "${code}"`
            }
        });
    }

    const permission = await context.security.getPermission<TPermission>(name);

    if (!permission) {
        throw new NotAuthorizedError({
            data: {
                reason: `missing permission "${name}"`
            }
        });
    }

    if (!check) {
        return permission;
    }
    // r = read
    // w = write
    // d = delete
    if (check.rwd && !hasRwd(permission, check.rwd)) {
        throw new NotAuthorizedError({
            data: {
                reason: `missing "${name}" rwd "${check.rwd}"`
            }
        });
    }

    // r = request review
    // c = request change
    // p = publish
    // u = unpublish
    if (check.rcpu && !hasRcpu(permission, check.rcpu)) {
        throw new NotAuthorizedError({
            data: {
                reason: `missing "${name}" rcpu "${check.rcpu}"`
            }
        });
    }

    return permission;
};

export const checkOwnership = (
    context: CmsContext,
    permission: SecurityPermission,
    record: { createdBy?: CreatedByType; ownedBy?: CreatedByType },
    field = "createdBy"
): void => {
    if (!permission.own) {
        return;
    }

    const identity = context.security.getIdentity();

    if (!identity || record[field].id !== identity.id) {
        throw new NotAuthorizedError({
            data: {
                reason: `ownership`
            }
        });
    }
};

export const validateOwnership = (
    context: CmsContext,
    permission: SecurityPermission,
    record: { createdBy?: CreatedByType; ownedBy?: CreatedByType },
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
    permission: SecurityPermission<CmsContentModelPermissionType>,
    model: CmsContentModelType
): void => {
    if (validateModelAccess(context, permission, model)) {
        return;
    }
    throw new NotAuthorizedError({
        data: {
            reason: `model access`
        }
    });
};
export const validateModelAccess = (
    context: CmsContext,
    permission: SecurityPermission<CmsContentModelPermissionType>,
    model: CmsContentModelType
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

export const checkEntryAccess = (
    context: CmsContext,
    permission: SecurityPermission<CmsContentEntryPermissionType>,
    model: CmsContentModelType
): void => {
    if (validateEntryAccess(context, permission, model)) {
        return;
    }
    throw new NotAuthorizedError({
        data: {
            reason: `entry access`
        }
    });
};

export const validateEntryAccess = (
    context: CmsContext,
    permission: SecurityPermission<CmsContentEntryPermissionType>,
    model: CmsContentModelType
): boolean => {
    return validateModelAccess(context, permission, model);
};

export const toSlug = text => {
    return slugify(text, {
        replacement: "-",
        lower: true,
        remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g
    });
};

export const encodeElasticSearchCursor = (cursor?: any) => {
    if (!cursor) {
        return null;
    }

    return Buffer.from(JSON.stringify(cursor)).toString("base64");
};

export const decodeElasticSearchCursor = (cursor?: string) => {
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
