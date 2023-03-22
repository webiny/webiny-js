import { FileManagerContextObject, FileManagerStorageOperations } from "~/types";
import { GetPermission, SecurityIdentity } from "@webiny/api-security/types";
import { createFilesCrud } from "~/createFileManager/files.crud";
import { FileStorage } from "~/storage/FileStorage";
import { createSettingsCrud } from "~/createFileManager/settings.crud";
import { createSystemCrud } from "~/createFileManager/system.crud";

export interface FileManagerConfig {
    storageOperations: FileManagerStorageOperations;
    getTenantId: () => string;
    getLocaleCode: () => string;
    getIdentity: () => SecurityIdentity;
    getPermission: GetPermission;
    storage: FileStorage;
    WEBINY_VERSION: string;
}

export const createFileManager = (config: FileManagerConfig): FileManagerContextObject => {
    const filesCrud = createFilesCrud(config);
    const settingsCrud = createSettingsCrud(config);
    const systemCrud = createSystemCrud(config);

    return {
        ...filesCrud,
        ...settingsCrud,
        ...systemCrud,
        storage: config.storage
    };
};
