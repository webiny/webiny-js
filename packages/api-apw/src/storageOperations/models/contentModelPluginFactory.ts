import { CmsModelPlugin, CmsPrivateModelFull, createCmsModel } from "@webiny/api-headless-cms";
import { CmsGroup } from "@webiny/api-headless-cms/types";

interface Params {
    group: Pick<CmsGroup, "id" | "name">;
    modelDefinition: Omit<CmsPrivateModelFull, "group" | "noValidate">;
}

export const contentModelPluginFactory = (params: Params): CmsModelPlugin => {
    const { group, modelDefinition } = params;

    return createCmsModel({
        ...modelDefinition,
        group,
        noValidate: true
    });
};
