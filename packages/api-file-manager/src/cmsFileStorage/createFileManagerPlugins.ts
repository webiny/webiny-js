import { createFileModelDefinition } from "~/cmsFileStorage/file.model";

interface CreateFileManagerPluginsParams {
    withPrivateFiles: boolean;
}

export const createFileModel = (params: CreateFileManagerPluginsParams) => {
    return {
        fileModelDefinition: createFileModelDefinition({
            withPrivateFiles: params.withPrivateFiles
        })
    };
};
