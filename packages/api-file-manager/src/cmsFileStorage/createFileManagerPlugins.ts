import { CmsGroupPlugin } from "@webiny/api-headless-cms";
// import { modelFactory } from "~/cmsFileStorage/modelFactory";
import { createFileModelDefinition } from "~/cmsFileStorage/file.model";

export const createFileManagerPlugins = () => {
    const groupId = "contentModelGroup_fm";

    const groupPlugin = new CmsGroupPlugin({
        id: groupId,
        slug: "fileManager",
        name: "File Manager",
        description: "Group for File Manager models",
        icon: "fas/folder",
        isPrivate: true
    });

    // const models = modelDefinitions.map(modelDefinition => {
    //     return modelFactory({
    //         group: cmsGroupPlugin.contentModelGroup,
    //         modelDefinition
    //     });
    // });

    return {
        groupPlugin,
        fileModelDefinition: createFileModelDefinition(groupPlugin.contentModelGroup)
    };
};
