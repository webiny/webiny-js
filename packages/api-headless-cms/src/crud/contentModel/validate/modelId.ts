import WebinyError from "@webiny/error";
import { CmsModel } from "~/types";

const disallowedModelIdList: string[] = [
    "contentModel",
    "contentModels",
    "contentModelGroup",
    "contentModelGroups"
];
const isModelIdAllowed = (modelId: string): boolean => {
    return disallowedModelIdList.includes(modelId) === false;
};

interface ModelIdAllowedParams {
    model: Pick<CmsModel, "modelId">;
}

export const validateModelIdAllowed = (params: ModelIdAllowedParams) => {
    const { model } = params;
    if (isModelIdAllowed(model.modelId)) {
        return;
    }
    throw new WebinyError(
        `Provided model ID "${model.modelId}" is not allowed.`,
        "MODEL_ID_NOT_ALLOWED",
        {
            input: model.modelId
        }
    );
};

interface Params {
    existingModel: Pick<CmsModel, "modelId">;
    model: Pick<CmsModel, "modelId">;
}

export const validateExistingModelId = (params: Params): void => {
    const { existingModel, model } = params;

    if (existingModel.modelId === model.modelId) {
        throw new WebinyError(
            `Content model with modelId "${model.modelId}" already exists.`,
            "MODEL_ID_EXISTS",
            {
                input: existingModel.modelId
            }
        );
    }
};
