import { ContextPlugin } from "@webiny/handler/types";
import { SETTINGS_KEY } from "./crud/filesSettings.crud";
import uploadAndCreateFile from "./resolvers/utils/uploadAndCreateFile";

export default [
    {
        type: "context",
        name: "context-file-manager",
        async apply(context) {
            if (!context.fileManager) {
                context.fileManager = {};
            }

            context.fileManager.settings = await context.filesSettings.get(SETTINGS_KEY);
            context.fileManager.uploadFile = uploadAndCreateFile;
        }
    } as ContextPlugin
];
