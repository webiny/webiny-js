import { CmsModelPlugin, createCmsModel } from "@webiny/api-headless-cms";
import { CmsModel, CmsGroup } from "@webiny/api-headless-cms/types";

interface Params {
    group: Pick<CmsGroup, "id" | "name">;
    /**
     * Locale and tenant do not need to be defined.
     * In that case model is not bound to any locale or tenant.
     * You can bind it to locale, tenant, both or none.
     */
    locale?: string;
    tenant?: string;
    modelDefinition: Omit<
        CmsModel,
        "locale" | "tenant" | "webinyVersion" | "group" | "singularApiName" | "pluralApiName"
    > & { isPrivate: true };
}

export const modelFactory = (params: Params): CmsModelPlugin => {
    const { group, locale, tenant, modelDefinition } = params;

    return createCmsModel({
        group,
        locale,
        tenant,
        ...modelDefinition
    });
};
