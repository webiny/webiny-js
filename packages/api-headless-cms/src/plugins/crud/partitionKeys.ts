import { Context } from "@webiny/handler/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";

type CrudContextType = Context<I18NContentContext, TenancyContext>;
type CreatePkCallableType = (context: CrudContextType, keys?: string[]) => string;
type CreatePkCallableFactoryType = (pkType: string) => CreatePkCallableType;

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

const createPartitionKey = (context: CrudContextType, pkType: string, keys: string[]) => {
    const locale = getLocaleKey(context);
    const tenant = getTenantKey(context);
    return [tenant, locale, pkType].concat(keys).join("#");
};

const createPkCallableFactory: CreatePkCallableFactoryType = pkType => {
    return (context: CrudContextType, keys: string[] = []): string => {
        return createPartitionKey(context, pkType, keys);
    };
};
export const createEnvironmentPk = createPkCallableFactory(PartitionKeysEnum.CMS_ENVIRONMENT);
export const createEnvironmentAliasPk = createPkCallableFactory(
    PartitionKeysEnum.CMS_ENVIRONMENT_ALIAS
);

export const createSettingsPk = createPkCallableFactory(PartitionKeysEnum.CMS_SETTINGS);
export const createContentModelGroupPk = createPkCallableFactory(
    PartitionKeysEnum.CMS_CONTENT_MODEL_GROUP
);
