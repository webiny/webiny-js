import type { CmsContext } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";

/**
 * Helper to get model by modelId.
 */
export const getModel = async (context: CmsContext, modelId: string): Promise<CmsModel> => {
    const model = await context.cms.getModel(modelId);
    if (!model) {
        throw new Error(`Model "${modelId}" not found`);
    }
    return model;
};
