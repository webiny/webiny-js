import { SecurityContext } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/handler/types";
import { HttpContext } from "@webiny/handler-http/types";
import { DbContext } from "@webiny/handler-db/types";
import { ElasticSearchClientContext } from "@webiny/api-plugin-elastic-search-client/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";

import filesCrud from "./crud/files.crud";
import fileManagerSettingsCrud from "./crud/filesSettings.crud";
import { FilesCRUD, FileManagerSettingsCRUD } from "../types";
import { FileStorage } from "./FileStorage";
import { TenancyContext } from "@webiny/api-security-tenancy/types";

export type FileManagerContextPlugin = HttpContext &
    SecurityContext &
    TenancyContext &
    I18NContentContext &
    DbContext &
    ElasticSearchClientContext;

export type FileManagerContext = {
    fileManager: {
        files: FilesCRUD;
        fileManagerSettings: FileManagerSettingsCRUD;
    };
};

export default {
    type: "context",
    apply: async context => {
        if (!context.fileManager) {
            // @ts-ignore
            context.fileManager = {};
        }

        context.fileManager.files = filesCrud(context);
        context.fileManager.fileManagerSettings = fileManagerSettingsCrud(context);

        // Get file storage plugin.
        const [fileStoragePlugin] = context.plugins.byType("api-file-manager-storage");
        // Add file storage to file manager context.
        context.fileManager.storage = new FileStorage({
            storagePlugin: fileStoragePlugin,
            settings: await context.fileManager.fileManagerSettings.getSettings(),
            context
        });
    }
} as ContextPlugin<FileManagerContextPlugin>;
