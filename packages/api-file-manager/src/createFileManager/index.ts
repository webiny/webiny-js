import { FileManagerContextObject, FileManagerStorageOperations } from "~/types";
import { GetPermissions, SecurityIdentity } from "@webiny/api-security/types";
import { createFilesCrud } from "~/createFileManager/files.crud";
import { FileStorage } from "~/storage/FileStorage";
import { createSettingsCrud } from "~/createFileManager/settings.crud";
import { createSystemCrud } from "~/createFileManager/system.crud";
import { FilesPermissions } from "~/createFileManager/permissions/FilesPermissions";

export interface FileManagerConfig {
    storageOperations: FileManagerStorageOperations;
    filesPermissions: FilesPermissions;
    getTenantId: () => string;
    getLocaleCode: () => string;
    getIdentity: () => SecurityIdentity;
    getPermissions: GetPermissions;
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
