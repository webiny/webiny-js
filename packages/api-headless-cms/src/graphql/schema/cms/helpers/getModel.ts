import type { CmsContext } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";

export const getModel = async (context: CmsContext, modelId: string): Promise<CmsModel> => {
    const result = await context.container.resolve(GetModelUseCase).execute(modelId);
    if (result.isFail()) {
        throw result.error;
    }
    if (!result.value) {
        throw new Error(`Model "${modelId}" not found`);
    }
    return result.value;
};
