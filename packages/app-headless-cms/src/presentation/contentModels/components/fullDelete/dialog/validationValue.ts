import type { CmsModel } from "~/types.js";

export const createValidationValue = (params: Pick<CmsModel, "modelId">) => {
    return `delete ${params.modelId}`;
};
