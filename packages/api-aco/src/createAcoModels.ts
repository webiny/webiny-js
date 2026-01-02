import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { createFilterModel } from "~/filter/filter.model.js";
import { modelFactory } from "~/utils/modelFactory.js";
import { FolderCmsModelModifierPlugin } from "~/folder/createFolderModelModifier.js";
import { createFolderModel } from "~/domain/folder/folder.model.js";

// TODO: revisit this when we get to model extensions
export const createAcoModels = async (context: CmsContext) => {
    /**
     * Create CmsModel plugins.
     */
    const folderModel = createFolderModel();

    const modelModifiers = context.plugins.byType<FolderCmsModelModifierPlugin>(
        FolderCmsModelModifierPlugin.type
    );

    for (const modifier of modelModifiers) {
        await modifier.modifyModel(folderModel);
    }

    const modelDefinitions = [folderModel, createFilterModel()];
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
