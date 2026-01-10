import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createFilterModel } from "~/filter/filter.model.js";
import { createCmsModel } from "@webiny/api-headless-cms";

// TODO: revisit this when we get to model extensions
export const createAcoModels = async (context: CmsContext) => {
    /**
     * Create CmsModel plugins.
     */
    const modelDefinitions = [createFilterModel()];
    const cmsModelPlugins = modelDefinitions.map(modelDefinition => {
        return createCmsModel(modelDefinition);
    });

    /**
     *  Register them so that they are accessible in cms context
     */
    context.plugins.register([cmsModelPlugins]);
};
