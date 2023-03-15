import WebinyError from "@webiny/error";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin";
import { CmsContext, CmsApiModel } from "~/types";
import { validateModelFields } from "~/crud/contentModel/validateModelFields";

interface ValidateModelParams {
    model: CmsApiModel;
    original?: CmsApiModel;
    context: CmsContext;
}

export const validateModel = async (params: ValidateModelParams): Promise<void> => {
    const { model, context } = params;

    const { plugins } = context;

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

    await validateModelFields(params);
};
