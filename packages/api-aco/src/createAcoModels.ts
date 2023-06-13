import { CmsGroupPlugin } from "@webiny/api-headless-cms";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { createFolderModelDefinition } from "~/folder/folder.model";
import { createSearchModelDefinition } from "~/record/record.model";
import { isInstallationPending } from "~/utils/isInstallationPending";
import { modelFactory } from "~/utils/modelFactory";

export const createAcoModels = (context: CmsContext) => {
    /**
     * This should never happen in the actual project.
     * It is to make sure that we load setup context before the CRUD init in our internal code.
     */
    if (!context.cms) {
        console.warn("Creating model before cms init.");
        return;
    }

    if (isInstallationPending({ tenancy: context.tenancy, i18n: context.i18n })) {
        return;
    }

    const groupId = "contentModelGroup_aco";

    /**
     * Create a CmsGroup.
     */
    const cmsGroupPlugin = new CmsGroupPlugin({
        id: groupId,
        slug: "aco",
        name: "ACO",
        description: "Group for Advanced Content Organisation and Search",
        icon: "fas/folder",
        isPrivate: true
    });

    /**
     * Create  CmsModel plugins.
     */
    const modelDefinitions = [createFolderModelDefinition(), createSearchModelDefinition()];
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
