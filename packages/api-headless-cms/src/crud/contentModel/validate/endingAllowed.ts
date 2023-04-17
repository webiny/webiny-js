import WebinyError from "@webiny/error";
import { disallowedEnding, isModelEndingAllowed } from "./isModelEndingAllowed";
import { CmsModel } from "~/types";

interface Params {
    model: Pick<CmsModel, "singularApiName" | "pluralApiName">;
}

export const validateEndingAllowed = (params: Params): void => {
    const { model } = params;
    if (isModelEndingAllowed(model.singularApiName) === false) {
        throw new WebinyError(
            `Content model with singularApiName "${model.singularApiName}" is not allowed, as it ends in disallowed value.`,
            "MODEL_SINGULAR_API_NAME_ENDING_NOT_ALLOWED",
            {
                input: model.singularApiName,
                disallowedEnding
            }
        );
    } else if (isModelEndingAllowed(model.pluralApiName) === false) {
        throw new WebinyError(
            `Content model with pluralApiName "${model.pluralApiName}" is not allowed, as it ends in disallowed value.`,
            "MODEL_PLURAL_API_NAME_NOT_ENDING_ALLOWED",
            {
                input: model.pluralApiName,
                disallowedEnding: disallowedEnding
            }
        );
    }
};
