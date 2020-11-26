import { ContextPlugin } from "@webiny/handler/types";
import { SETTINGS_KEY } from "./crud/filesSettings.crud";
import { FileStorage, FileStorageContext } from "@webiny/api-file-manager/plugins/FileStorage";

export default [
    {
        type: "context",
        name: "context-file-manager",
        async apply(context) {
            if (!context.fileManager) {
                context.fileManager = {};
            }

            context.fileManager.settings = await context.filesSettings.get(SETTINGS_KEY);

            // Get file storage plugin
            const [fileStoragePlugin] = context.plugins.byType("api-file-manager-storage");

            context.fileManager.storage = new FileStorage({
                storagePlugin: fileStoragePlugin,
                settings: context.fileManager.settings,
                context
            });
        }
    } as ContextPlugin<FileStorageContext>
];
