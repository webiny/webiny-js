import { CmsModelPlugin, CmsPrivateModelFull, createCmsModel } from "@webiny/api-headless-cms";
import { CmsGroup } from "@webiny/api-headless-cms/types";

interface Params {
    group: Pick<CmsGroup, "id" | "name">;
    /**
     * Locale and tenant do not need to be defined.
     * In that case model is not bound to any locale or tenant.
     * You can bind it to locale, tenant, both or none.
     */
    locale?: string;
    tenant?: string;
    modelDefinition: Omit<CmsPrivateModelFull, "noValidate" | "group">;
}

export const modelFactory = (params: Params): CmsModelPlugin => {
    const { group, locale, tenant, modelDefinition } = params;

    return createCmsModel({
        group,
        locale,
        tenant,
        ...modelDefinition,
        noValidate: true
    });
};
