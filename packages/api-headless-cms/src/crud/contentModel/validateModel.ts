import WebinyError from "@webiny/error";
import { CmsModelPlugin } from "~/plugins/CmsModelPlugin";
import { CmsContext, CmsModel } from "~/types";
import { validateModelFields } from "./validateModelFields";

interface ValidateModelParams {
    models: CmsModel[];
    model: CmsModel;
    original?: CmsModel;
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
