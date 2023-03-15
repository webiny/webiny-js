import { plugins } from "@webiny/plugins";
import { AppFileManagerStoragePlugin } from "@webiny/app/types";

export const getFileUploader = (): AppFileManagerStoragePlugin["upload"] => {
    const fileStoragePlugin = plugins.byName<AppFileManagerStoragePlugin>(
        "app-file-manager-storage"
    );

    if (!fileStoragePlugin) {
        throw Error('Missing plugin: "app-file-manager-storage".');
    }

    return fileStoragePlugin.upload;
};
