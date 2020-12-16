import slugify from "slugify";
import { CmsContext } from "./types";
import { SecurityIdentity, SecurityPermission } from "@webiny/api-security/types";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { hasPermission, NotAuthorizedError, NotAuthorizedResponse } from "@webiny/api-security";

type KeyGettersType = {
    tenant: (context: CmsContext) => string;
    locale: (context: CmsContext) => string;
    environment: (context: CmsContext) => string;
};
type KeyGetterValue = keyof KeyGettersType;
type CreatePkCallableType = (context: CmsContext) => string;
type ModelCreatableByUserType = {
    createdBy?: {
        id?: string;
    };
};
type CRUDType = "r" | "w" | "d";
type HasRwdCallableArgsType = {
    permission?: {
        name: string;
        rwd?: CRUDType;
    };
    rwd: CRUDType;
};

type CheckBasePermissionsCallable = (
    context: CmsContext,
    rwd?: CRUDType
) => Promise<SecurityPermission>;

enum PartitionKeysEnum {
    CMS_ENVIRONMENT = "CE",
    CMS_ENVIRONMENT_ALIAS = "CEA",
    CMS_SETTINGS = "CS",
    CMS_CONTENT_MODEL_GROUP = "CMG",
    CMS_CONTENT_MODEL = "CM",
    CMS_CONTENT_MODEL_ENTRY = "CME"
}

enum CmsPermission {
    SETTINGS_PERMISSION = "cms.manage.settings",
    CONTENT_MODEL_PERMISSION = "cms.manage.contentModel",
    CONTENT_MODEL_ENTRY_PERMISSION = "cms.manage.contentModelEntry"
}

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
        const environment = context.cms.getEnvironment();
        if (!environment) {
            throw new Error(`There is no environment in "context.cms".`);
        }
        return {
            index: `${tenant.id}-cms-${context.cms.environment}`,
            type: "_doc"
        };
    }
};

export const getCmsManageSettingsPermission = async (context: CmsContext) => {
    return await context.security.getPermission(CmsPermission.SETTINGS_PERMISSION);
};

export const hasManageSettingsPermission = () => {
    return hasPermission(CmsPermission.SETTINGS_PERMISSION);
};

const hasRwdOnPermission = ({ permission, rwd }: HasRwdCallableArgsType) => {
    if (!permission) {
        return false;
    } else if (!permission.rwd || typeof permission.rwd !== "string") {
        return true;
    }
    return permission.rwd.includes(rwd);
};
// factory to create permission checking function - cached if already created
const checkBasePermissionsCache = new Map<string, CheckBasePermissionsCallable>();
const checkBasePermissionsFactory = (permissionName: string): CheckBasePermissionsCallable => {
    if (checkBasePermissionsCache.has(permissionName)) {
        return checkBasePermissionsCache.get(permissionName);
    }
    const fn: CheckBasePermissionsCallable = async (context, rwd = undefined) => {
        await context.i18nContent.checkI18NContentPermission();
        const permission = await context.security.getPermission(permissionName);
        if (!permission) {
            throw new NotAuthorizedError();
        }

        if (rwd && !hasRwdOnPermission({ permission, rwd })) {
            throw new NotAuthorizedError();
        }

        return permission;
    };
    checkBasePermissionsCache.set(permissionName, fn);
    return fn;
};
export const checkBaseContentModelPermissions = checkBasePermissionsFactory(
    CmsPermission.CONTENT_MODEL_PERMISSION
);
export const checkBaseContentModelEntryPermissions = checkBasePermissionsFactory(
    CmsPermission.CONTENT_MODEL_ENTRY_PERMISSION
);

export const checkOwnership = (
    context: CmsContext,
    permission: SecurityPermission,
    model: ModelCreatableByUserType
): void => {
    if (!permission.own) {
        return;
    }
    const identity = context.security.getIdentity();
    if (!model.createdBy || !model.createdBy.id) {
        throw new Error(
            `Object you are checking for access rights does not have "createdBy" property assigned.`
        );
    } else if (model.createdBy.id !== identity.id) {
        throw new NotAuthorizedError();
    }
};

export const validateOwnership = (
    context: CmsContext,
    permission: SecurityPermission,
    model: ModelCreatableByUserType
): boolean => {
    if (!permission.own) {
        return true;
    }
    const identity = context.security.getIdentity();
    if (!model.createdBy || !model.createdBy.id) {
        return false;
    } else if (model.createdBy.id !== identity.id) {
        return false;
    }
    return true;
};

export const hasCmsManageSettingsPermissionRwd = (rwd: CRUDType) => {
    return hasRwdPermission(CmsPermission.SETTINGS_PERMISSION, rwd);
};

export const hasRwdPermission = (permissionName: string, rwd: CRUDType) => {
    return (resolver: GraphQLFieldResolver) => {
        return async (parent, args, context: CmsContext, info) => {
            const permission = await context.security.getPermission(permissionName);
            if (!permission || !hasRwdOnPermission({ permission, rwd })) {
                return new NotAuthorizedResponse();
            }
            return resolver(parent, args, context, info);
        };
    };
};

export const userCanManageModel = (
    identity: SecurityIdentity,
    model: ModelCreatableByUserType
): boolean => {
    if (!model.createdBy || !model.createdBy.id) {
        throw new Error(
            `Object you are checking for access rights does not have "createdBy" property assigned.`
        );
    }
    return model.createdBy.id === identity.id;
};

const getLocaleKey = ({ cms }: CmsContext): string => {
    if (!cms) {
        throw new Error(`Missing "cms" in context.`);
    } else if (!cms.locale && typeof cms.getLocale !== "function") {
        throw new Error(
            `Missing both "context.cms.getLocale()" function and "context.cms.locale" variable.`
        );
    }
    const code: string = typeof cms.getLocale === "function" ? cms.getLocale().code : cms.locale;
    if (!code) {
        throw new Error(`Missing "context.cms" locale "code" value.`);
    }
    return `L#${code}`;
};

const getTenantKey = ({ security }: CmsContext): string | undefined => {
    if (typeof security.getTenant !== "function") {
        throw new Error(
            "There is no getTenant() on context.security. Check if tenancy is included in the context."
        );
    }
    const tenant = security.getTenant();
    if (!tenant) {
        throw new Error("Tenant missing.");
    }
    return `T#${tenant.id}`;
};

const getEnvironmentKey = ({ cms }: CmsContext): string => {
    if (!cms) {
        throw new Error(`Missing "context.cms".`);
    } else if (!cms.environment && typeof cms.getEnvironment !== "function") {
        throw new Error(
            `Missing both "context.cms.getEnvironment()" function and "context.cms.environment" variable.`
        );
    }
    const env =
        typeof cms.getEnvironment === "function" ? cms.getEnvironment().slug : cms.environment;
    if (!env) {
        throw new Error("Missing environment in the context.");
    }
    return env;
};

const keysGetters: KeyGettersType = {
    tenant: getTenantKey,
    locale: getLocaleKey,
    environment: getEnvironmentKey
};

const PARTITION_KEY_ORDER: KeyGetterValue[] = ["tenant", "environment", "locale"];

const createPartitionKey = (context: CmsContext, type: string, keys: KeyGetterValue[]) => {
    return PARTITION_KEY_ORDER.filter(key => {
        return keys.includes(key);
    })
        .map(key => {
            return keysGetters[key](context);
        })
        .concat([type])
        .join("#");
};

const createPkCallableFactory = (type: string, keys: KeyGetterValue[]): CreatePkCallableType => {
    return (context: CmsContext): string => {
        return createPartitionKey(context, type, keys);
    };
};

// tenant and locale in pk
export const createEnvironmentPk = createPkCallableFactory(PartitionKeysEnum.CMS_ENVIRONMENT, [
    "tenant",
    "locale"
]);

export const createEnvironmentAliasPk = createPkCallableFactory(
    PartitionKeysEnum.CMS_ENVIRONMENT_ALIAS,
    ["tenant", "locale"]
);

// tenant, locale and environment in pk
export const createContentModelGroupPk = createPkCallableFactory(
    PartitionKeysEnum.CMS_CONTENT_MODEL_GROUP,
    ["tenant", "locale", "environment"]
);

export const createContentModelPk = createPkCallableFactory(PartitionKeysEnum.CMS_CONTENT_MODEL, [
    "tenant",
    "locale",
    "environment"
]);

export const createContentModelEntryPk = createPkCallableFactory(
    PartitionKeysEnum.CMS_CONTENT_MODEL_ENTRY,
    ["tenant", "locale", "environment"]
);

// with tenant only
export const createSettingsPk = createPkCallableFactory(PartitionKeysEnum.CMS_SETTINGS, ["tenant"]);

export const toSlug = text => {
    return slugify(text, {
        replacement: "-",
        lower: true,
        remove: /[*#\?<>_\{\}\[\]+~.()'"!:;@]/g
    });
};
