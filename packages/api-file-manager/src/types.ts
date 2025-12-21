import { File } from "~/domain/file/types.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

export interface FileStorageDto extends File {
    tenant: string;
}

export interface FileAliasStorageDto {
    tenant: string;
    fileId: string;
    alias: string;
}

export interface FilePermission extends SecurityPermission {
    name: "fm.file";
    rwd?: string;
    own?: boolean;
}

export interface SettingsPermission extends SecurityPermission {
    name: "fm.setting";
}

// TODO: implement alias storage
export interface FileAliasStorageOperations {
    storeAliases(file: FileStorageDto): Promise<void>;
    deleteAliases(file: FileStorageDto): Promise<void>;
}
