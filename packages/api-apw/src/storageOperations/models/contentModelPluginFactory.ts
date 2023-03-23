import { CmsModelPlugin, createCmsModel } from "@webiny/api-headless-cms";
import { CmsModel as BaseCmsModel, CmsGroup } from "@webiny/api-headless-cms/types";

interface CmsModel
    extends Omit<
        BaseCmsModel,
        "locale" | "tenant" | "webinyVersion" | "group" | "singularApiName" | "pluralApiName"
    > {
    isPrivate: true;
}

interface Params {
    group: Pick<CmsGroup, "id" | "name">;
    modelDefinition: CmsModel;
}

export const contentModelPluginFactory = (params: Params): CmsModelPlugin => {
    const { group, modelDefinition } = params;

    return createCmsModel({
        group,
        ...modelDefinition
    });
};
