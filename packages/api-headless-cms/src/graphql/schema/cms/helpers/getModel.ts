import type { CmsContext } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";

/**
 * Helper to get model by modelId.
 */
export const getModel = async (context: CmsContext, modelId: string): Promise<CmsModel> => {
    const model = await context.cms.getModel(modelId);
    // Private models are internal, so they are treated as unknown.
    if (!model || model.isPrivate) {
        throw new Error(`Model "${modelId}" not found`);
    }
    return model;
};
