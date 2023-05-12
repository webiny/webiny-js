import WebinyError from "@webiny/error";
import { CmsModel } from "~/types";

interface Params {
    existingModel: Pick<CmsModel, "singularApiName" | "pluralApiName">;
    model: Pick<CmsModel, "singularApiName" | "pluralApiName">;
}

export const validatePluralApiName = (params: Params): void => {
    const { existingModel, model } = params;

    if (existingModel.singularApiName === model.pluralApiName) {
        throw new WebinyError(
            `Content model with singularApiName "${model.pluralApiName}" already exists.`,
            "MODEL_SINGULAR_API_NAME_EXISTS",
            {
                input: model.pluralApiName
            }
        );
    } else if (existingModel.pluralApiName === model.pluralApiName) {
        throw new WebinyError(
            `Content model with pluralApiName "${model.pluralApiName}" already exists.`,
            "MODEL_PLURAL_API_NAME_EXISTS",
            {
                input: model.pluralApiName
            }
        );
    }
};
