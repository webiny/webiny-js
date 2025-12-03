import type { FileManagerContextObject } from "~/types.js";
import { createFilesCrud } from "~/createFileManager/files.crud.js";
import { createSettingsCrud } from "~/createFileManager/settings.crud.js";
import type { FileManagerConfig } from "~/createFileManager/types.js";

export const createFileManager = (config: FileManagerConfig): FileManagerContextObject => {
    const filesCrud = createFilesCrud(config);
    const settingsCrud = createSettingsCrud(config);

    return {
        ...filesCrud,
        ...settingsCrud,
        storage: config.storage
    };
};
