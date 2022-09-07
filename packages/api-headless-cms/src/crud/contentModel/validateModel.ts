import WebinyError from "@webiny/error";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin";
import { CmsModel } from "~/types";
import { PluginsContainer } from "@webiny/plugins";
import { validateModelFields } from "~/crud/contentModel/validateModelFields";

interface ValidateModelParams {
    model: CmsModel;
    plugins: PluginsContainer;
}

export const validateModel = (params: ValidateModelParams) => {
    const { model, plugins } = params;

    const modelPlugin = plugins
        .byType<CmsModelPlugin>(CmsModelPlugin.type)
        .find(item => item.contentModel.modelId === model.modelId);

    if (modelPlugin) {
        throw new WebinyError(
            "Content models defined via plugins cannot be updated.",
            "CONTENT_MODEL_UPDATE_ERROR",
            {
                modelId: model.modelId
            }
        );
    }

    validateModelFields(params);
};
