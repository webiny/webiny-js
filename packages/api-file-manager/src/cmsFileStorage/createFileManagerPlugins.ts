import { CmsGroupPlugin } from "@webiny/api-headless-cms";
import { modelFactory } from "~/cmsFileStorage/modelFactory";
import { createFileModelDefinition } from "~/cmsFileStorage/file.model";

export const createFileManagerPlugins = () => {
    const groupId = "contentModelGroup_fm";

    const cmsGroupPlugin = new CmsGroupPlugin({
        id: groupId,
        slug: "fileManager",
        name: "File Manager",
        description: "Group for File Manager models",
        icon: "fas/folder",
        isPrivate: true
    });

    const modelDefinitions = [createFileModelDefinition()];

    const models = modelDefinitions.map(modelDefinition => {
        return modelFactory({
            group: cmsGroupPlugin.contentModelGroup,
            modelDefinition
        });
    });

    return [cmsGroupPlugin, ...models];
};
