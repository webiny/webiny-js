import { CmsGroup } from "@webiny/api-headless-cms";
import { CmsModelPlugin } from "@webiny/api-headless-cms";
import { CmsModel } from "@webiny/api-headless-cms/types";

type ModelDefinition = Omit<CmsModel, "locale" | "tenant" | "webinyVersion" | "group">;

interface Params {
    group: CmsGroup;
    /**
     * Locale and tenant do not need to be defined.
     * In that case model is not bound to any locale or tenant.
     * You can bind it to locale, tenant, both or none.
     */
    locale?: string;
    tenant?: string;
    modelDefinition: ModelDefinition;
}

const contentModelPluginFactory = (params: Params): CmsModelPlugin => {
    const { group, locale, tenant, modelDefinition } = params;

    return new CmsModelPlugin({
        group,
        locale,
        tenant,
        ...modelDefinition
    });
};

export default contentModelPluginFactory;
