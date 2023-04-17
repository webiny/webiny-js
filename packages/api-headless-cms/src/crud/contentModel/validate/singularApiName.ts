import WebinyError from "@webiny/error";
import { CmsModel } from "~/types";

interface Params {
    existingModel: Pick<CmsModel, "singularApiName" | "pluralApiName">;
    model: Pick<CmsModel, "singularApiName" | "pluralApiName">;
}

export const validateSingularApiName = (params: Params): void => {
    const { existingModel, model } = params;

    if (existingModel.singularApiName === model.singularApiName) {
        throw new WebinyError(
            `Content model with singularApiName "${model.singularApiName}" already exists.`,
            "MODEL_SINGULAR_API_NAME_EXISTS",
            {
                input: model.singularApiName
            }
        );
    } else if (existingModel.pluralApiName === model.singularApiName) {
        throw new WebinyError(
            `Content model with pluralApiName "${model.singularApiName}" already exists.`,
            "MODEL_PLURAL_API_NAME_EXISTS",
            {
                input: model.singularApiName
            }
        );
    }
};
