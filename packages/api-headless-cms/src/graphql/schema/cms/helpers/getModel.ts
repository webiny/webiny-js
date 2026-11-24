import type { CmsContext } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";

export const getModel = async (context: CmsContext, modelId: string): Promise<CmsModel> => {
    const result = await context.container.resolve(GetModelUseCase).execute(modelId);
    if (result.isFail()) {
        throw result.error;
    }
    // Private models are internal, so they are treated as unknown.
    if (!result.value || result.value.isPrivate) {
        throw new Error(`Model "${modelId}" not found`);
    }
    return result.value;
};
