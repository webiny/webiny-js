import { CmsGroupPlugin } from "@webiny/api-headless-cms";
import { createFileModelDefinition } from "~/cmsFileStorage/file.model";

interface CreateFileManagerPluginsParams {
    withPrivateFiles: boolean;
}

export const createFileManagerPlugins = (params: CreateFileManagerPluginsParams) => {
    const groupId = "contentModelGroup_fm";

    const groupPlugin = new CmsGroupPlugin({
        id: groupId,
        slug: "fileManager",
        name: "File Manager",
        description: "Group for File Manager models",
        icon: "fas/folder",
        isPrivate: true
    });

    return {
        groupPlugin,
        fileModelDefinition: createFileModelDefinition({
            contentModelGroup: groupPlugin.contentModelGroup,
            withPrivateFiles: params.withPrivateFiles
        })
    };
};
