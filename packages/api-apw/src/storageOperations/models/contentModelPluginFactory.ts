import { CmsModelPlugin, createCmsModel } from "@webiny/api-headless-cms";
import { CmsModel, CmsGroup } from "@webiny/api-headless-cms/types";

interface Params {
    group: Pick<CmsGroup, "id" | "name">;
    modelDefinition: Omit<CmsModel, "locale" | "tenant" | "webinyVersion" | "group">;
}

export const contentModelPluginFactory = (params: Params): CmsModelPlugin => {
    const { group, modelDefinition } = params;

    return createCmsModel({
        group,
        ...modelDefinition
    });
};
