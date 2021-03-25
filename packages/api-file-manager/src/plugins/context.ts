import { ContextPlugin } from "@webiny/handler/types";
import filesCRUD from "./crud/files.crud";
import settingsCRUD from "./crud/settings.crud";
import systemCRUD from "./crud/system.crud";
import { FileStorage } from "./FileStorage";
import { FileManagerContext } from "../types";

export default {
    type: "context",
    apply: async context => {
        const { i18nContent, security } = context;
        if (!security.getTenant() || !i18nContent.getLocale()) {
            return;
        }

        context.fileManager = {
            ...context.fileManager,
            files: filesCRUD(context),
            system: systemCRUD(context),
            settings: settingsCRUD(context),
            storage: new FileStorage({
                context
            })
        };
    }
} as ContextPlugin<FileManagerContext>;
