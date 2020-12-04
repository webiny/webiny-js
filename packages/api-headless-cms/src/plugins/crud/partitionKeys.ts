import { Context } from "@webiny/handler/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";

type CrudContextType = Context<I18NContentContext, TenancyContext>;
type CreatePkCallableType = (context: CrudContextType) => string;
type CreatePkCallableFactoryType = (type: string) => CreatePkCallableType;

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

const createPartitionKey = (context: CrudContextType, pkType: string) => {
    const locale = getLocaleKey(context);
    const tenant = getTenantKey(context);
    return [tenant, locale, pkType].join("#");
};
const createTenantOnlyPartitionKeyOnly = (context: CrudContextType, pkType: string) => {
    const tenant = getTenantKey(context);
    return [tenant, pkType].join("#");
};

const createPkCallableFactory: CreatePkCallableFactoryType = type => {
    return (context: CrudContextType): string => {
        return createPartitionKey(context, type);
    };
};
const createPkTenantCallableFactory: CreatePkCallableFactoryType = type => {
    return (context: CrudContextType): string => {
        return createTenantOnlyPartitionKeyOnly(context, type);
    };
};
// tenant and locale in pk
export const createEnvironmentPk = createPkCallableFactory(PartitionKeysEnum.CMS_ENVIRONMENT);
export const createEnvironmentAliasPk = createPkCallableFactory(
    PartitionKeysEnum.CMS_ENVIRONMENT_ALIAS
);

export const createContentModelGroupPk = createPkCallableFactory(
    PartitionKeysEnum.CMS_CONTENT_MODEL_GROUP
);
// with tenant only
export const createSettingsPk = createPkTenantCallableFactory(PartitionKeysEnum.CMS_SETTINGS);
