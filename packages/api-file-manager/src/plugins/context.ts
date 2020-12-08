import { ContextPlugin } from "@webiny/handler/types";
import filesCRUD from "./crud/files.crud";
import settingsCRUD from "./crud/settings.crud";
import { FileStorage } from "./FileStorage";
import { FileManagerContext } from "../types";

export default {
    type: "context",
    apply: async context => {
        const { i18nContent, security } = context;
        if (!security.getTenant() || !i18nContent.getLocale()) {
            return;
        }

        // Get file storage plugin. We get it `byName` because we only support 1 storage plugin.
        const fileStoragePlugin = context.plugins.byName("api-file-manager-storage");

        const settings = settingsCRUD(context);

        context.fileManager = {
            ...context.fileManager,
            files: filesCRUD(context),
            settings,
            storage: new FileStorage({
                storagePlugin: fileStoragePlugin,
                settings: await settings.getSettings(),
                context
            })
        };
    }
} as ContextPlugin<FileManagerContext>;
