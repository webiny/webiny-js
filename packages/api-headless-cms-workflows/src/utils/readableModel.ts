import type { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import type { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

interface IGetReadableModelParams {
    getModel: GetModelUseCase.Interface;
    accessControl: AccessControl.Interface;
    modelId: string;
}

/**
 * Returns the model when the current identity can read its entries, otherwise `null`.
 */
export const getReadableModel = async (
    params: IGetReadableModelParams
): Promise<CmsModel | null> => {
    const { getModel, accessControl, modelId } = params;
    const modelResult = await getModel.execute(modelId);
    if (modelResult.isFail()) {
        return null;
    }
    const model = modelResult.value;
    const canRead = await accessControl.canAccessEntry({ model, rwd: "r" });
    return canRead ? model : null;
};
