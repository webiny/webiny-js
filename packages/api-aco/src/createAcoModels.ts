import { CmsContext } from "@webiny/api-headless-cms/types";
import { createFilterModelDefinition } from "~/filter/filter.model";
import { createFolderModelDefinition } from "~/folder/folder.model";
import { createSearchModelDefinition } from "~/record/record.model";
import { modelFactory } from "~/utils/modelFactory";

export const createAcoModels = (context: CmsContext) => {
    /**
     * Create  CmsModel plugins.
     */
    const modelDefinitions = [
        createFolderModelDefinition(),
        createSearchModelDefinition(),
        createFilterModelDefinition()
    ];
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
