import { CmsContext } from "@webiny/api-headless-cms/types";
import { createFilterModel } from "~/filter/filter.model";
import { createFolderModel } from "~/folder/folder.model";
import { createSearchModel } from "~/record/record.model";
import { modelFactory } from "~/utils/modelFactory";

export const createAcoModels = (context: CmsContext) => {
    /**
     * Create  CmsModel plugins.
     */
    const modelDefinitions = [createFolderModel(), createSearchModel(), createFilterModel()];
    const cmsModelPlugins = modelDefinitions.map(modelDefinition => {
        return modelFactory({
            modelDefinition
        });
    });

    /**
     *  Register them so that they are accessible in cms context
     */
    context.plugins.register([cmsModelPlugins]);
};
