import { CmsModelPlugin, CmsPrivateModelFull, createCmsModel } from "@webiny/api-headless-cms";

interface Params {
    /**
     * Locale and tenant do not need to be defined.
     * In that case model is not bound to any locale or tenant.
     * You can bind it to locale, tenant, both or none.
     */
    locale?: string;
    tenant?: string;
    modelDefinition: CmsPrivateModelFull;
}

export const modelFactory = (params: Params): CmsModelPlugin => {
    const { locale, tenant, modelDefinition } = params;

    return createCmsModel({
        locale,
        tenant,
        ...modelDefinition
    });
};
