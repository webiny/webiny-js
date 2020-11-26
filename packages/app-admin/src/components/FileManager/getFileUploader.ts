import { plugins } from "@webiny/plugins";
import { AppFileManagerStoragePlugin } from "@webiny/app/types";

export default () => {
    const [fileStoragePlugin] = plugins.byType<AppFileManagerStoragePlugin>(
        "app-file-manager-storage"
    );

    if (!fileStoragePlugin) {
        throw Error('Must register missing plugin: "app-file-manager-storage".');
    }

    return fileStoragePlugin.upload;
};
