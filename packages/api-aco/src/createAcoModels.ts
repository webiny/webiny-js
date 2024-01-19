import { CmsGroupPlugin } from "@webiny/api-headless-cms";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { createFilterModelDefinition } from "~/filter/filter.model";
import { createFolderModelDefinition } from "~/folder/folder.model";
import { createSearchModelDefinition } from "~/record/record.model";
import { modelFactory } from "~/utils/modelFactory";

export const createAcoModels = (context: CmsContext) => {
    const groupId = "contentModelGroup_aco";

    /**
     * Create a CmsGroup.
     */
    const cmsGroupPlugin = new CmsGroupPlugin({
        id: groupId,
        slug: "aco",
        name: "ACO",
        description: "Group for Advanced Content Organisation and Search",
        icon: {
            type: "emoji",
            name: "thumbs_up",
            value: "👍"
        },
        isPrivate: true
    });

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
            group: cmsGroupPlugin.contentModelGroup,
            modelDefinition
        });
    });

    /**
     *  Register them so that they are accessible in cms context
     */
    context.plugins.register([cmsGroupPlugin, cmsModelPlugins]);
};
