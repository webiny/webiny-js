import { Context } from "@webiny/handler/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";

type KeyGettersType = {
    tenant: (context: CrudContextType) => string;
    locale: (context: CrudContextType) => string;
    environment: (context: CrudContextType) => string;
};
type KeyGetterValue = keyof KeyGettersType;
type CrudContextType = Context<I18NContentContext, TenancyContext>;
type CreatePkCallableType = (context: CrudContextType) => string;
type CreatePkCallableFactoryType = (type: string, keys: KeyGetterValue[]) => CreatePkCallableType;

enum PartitionKeysEnum {
    CMS_ENVIRONMENT = "CE",
    CMS_ENVIRONMENT_ALIAS = "CEA",
    CMS_SETTINGS = "CS",
    CMS_CONTENT_MODEL_GROUP = "CMG"
}

const getLocaleKey = ({ i18nContent }: CrudContextType): string => {
    if (!i18nContent || !i18nContent.locale || !i18nContent.locale.code) {
        throw new Error("Locale missing.");
    }
    return `L#${i18nContent.locale.code}`;
};
const getTenantKey = ({ security }: CrudContextType): string | undefined => {
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

const getEnvironmentKey = ({ environment }: CrudContextType): string => {
    if (!environment || !environment.slug) {
        throw new Error("Missing environment in the context.");
    }
    return environment.slug;
};

const keysGetters: KeyGettersType = {
    tenant: getTenantKey,
    locale: getLocaleKey,
    environment: getEnvironmentKey
};

const createPartitionKey = (context: CrudContextType, type: string, keys: KeyGetterValue[]) => {
    return keys
        .map(key => {
            return keysGetters[key](context);
        })
        .concat([type])
        .join("#");
};

const createPkCallableFactory: CreatePkCallableFactoryType = (type, keys: KeyGetterValue[]) => {
    return (context: CrudContextType): string => {
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
// with tenant only
export const createSettingsPk = createPkCallableFactory(PartitionKeysEnum.CMS_SETTINGS, ["tenant"]);
