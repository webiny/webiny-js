import type { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import type { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";

/**
 * Whether the current identity can read and delete the model. The model delete guards check this
 * first, so a caller without access gets the CMS's own error from the decorated chain and never
 * the bound workflows' ids and names (R64).
 */
export const canCallerDeleteModel = async (
    getModel: GetModelUseCase.Interface,
    accessControl: AccessControl.Interface,
    modelId: string
): Promise<boolean> => {
    const model = await getModel.execute(modelId);
    if (model.isFail()) {
        return false;
    }
    return accessControl.canAccessModel({ model: model.value, rwd: "d" });
};
