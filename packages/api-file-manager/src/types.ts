import { Context } from "@webiny/handler/types";
import { ElasticSearchClientContext } from "@webiny/api-plugin-elastic-search-client/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { FileStorage } from "./plugins/FileStorage";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { SecurityPermission } from "@webiny/api-security/types";

export type FileManagerContext = Context<
    TenancyContext,
    I18NContentContext,
    ElasticSearchClientContext,
    {
        fileManager: {
            files: FilesCRUD;
            settings: SettingsCRUD;
            storage: FileStorage;
            system: SystemCRUD;
        };
    }
>;

export interface FilePermission extends SecurityPermission {
    name: "fm.file";
    rwd?: string;
    own?: boolean;
}

export type File = {
    id: string;
    key: string;
    size: number;
    type: string;
    name: string;
    meta: Record<string, any>;
    tags: string[];
    createdOn: string;
    createdBy: CreatedBy;
    /**
     * Added with new storage operations refactoring.
     */
    tenant: string;
    locale: string;
    webinyVersion: string;
};

export type CreatedBy = {
    id: string;
    displayName: string;
    type: string;
};

export type Sort = {
    SK: 1 | -1;
};

export type FileInput = {
    key: string;
    name: string;
    size: number;
    type: string;
    meta: Record<string, any>;
    tags: [string];
};

export type FilesListOpts = {
    search?: string;
    types?: string[];
    tags?: string[];
    ids?: string[];
    limit?: number;
    after?: string;
};

export type FileListMeta = {
    cursor: string;
    totalCount: number;
};

export type FilesCRUD = {
    getFile(id: string): Promise<File>;
    listFiles(opts?: FilesListOpts): Promise<[File[], FileListMeta]>;
    listTags(): Promise<string[]>;
    createFile(data: FileInput): Promise<File>;
    updateFile(id: string, data: Partial<FileInput>): Promise<File>;
    deleteFile(id: string): Promise<boolean>;
    createFilesInBatch(data: FileInput[]): Promise<File[]>;
};

export type SystemCRUD = {
    getVersion(): Promise<string>;
    setVersion(version: string): Promise<void>;
    install(args: { srcPrefix: string }): Promise<boolean>;
    upgrade(version: string, data?: Record<string, any>): Promise<boolean>;
};

export type FileManagerSettings = {
    key: string;
    uploadMinFileSize: number;
    uploadMaxFileSize: number;
    srcPrefix: string;
};

export interface FileManagerSystem {
    version: string;
}

export type SettingsCRUD = {
    getSettings(): Promise<FileManagerSettings>;
    createSettings(data?: Partial<FileManagerSettings>): Promise<FileManagerSettings>;
    updateSettings(data: Partial<FileManagerSettings>): Promise<FileManagerSettings>;
    deleteSettings(): Promise<boolean>;
};
/********
 * Storage operations
 *******/

/**
 * @category StorageOperations
 * @category SystemStorageOperations
 * @category SystemStorageOperationsParams
 */
export interface FileManagerSystemStorageOperationsUpdateParams {
    original: FileManagerSystem;
    data: Partial<FileManagerSystem>;
}
/**
 * @category StorageOperations
 * @category SystemStorageOperations
 * @category SystemStorageOperationsParams
 */
export interface FileManagerSystemStorageOperationsCreateParams {
    data: FileManagerSystem;
}

/**
 * @category StorageOperations
 * @category SystemStorageOperations
 */
export interface FileManagerSystemStorageOperations {
    /**
     * Get the FileManager system data.
     */
    get: () => Promise<FileManagerSystem | null>;
    /**
     * Update the FileManager system data..
     */
    update: (params: FileManagerSystemStorageOperationsUpdateParams) => Promise<FileManagerSystem>;
    /**
     * Create the FileManagerSystemData
     */
    create: (params: FileManagerSystemStorageOperationsCreateParams) => Promise<FileManagerSystem>;
}

/**
 * @category StorageOperations
 * @category SettingsStorageOperations
 * @category SettingsStorageOperationsParams
 */
export interface FileManagerSettingsStorageOperationsUpdateParams {
    original: FileManagerSettings;
    data: FileManagerSettings;
}
/**
 * @category StorageOperations
 * @category SettingsStorageOperations
 * @category SettingsStorageOperationsParams
 */
export interface FileManagerSettingsStorageOperationsCreateParams {
    data: FileManagerSettings;
}

/**
 * @category StorageOperations
 * @category SettingsStorageOperations
 */
export interface FileManagerSettingsStorageOperations {
    /**
     * Get the FileManager system data.
     */
    get: () => Promise<FileManagerSettings | null>;
    /**
     * Create the FileManagerSettingsData
     */
    create: (
        params: FileManagerSettingsStorageOperationsCreateParams
    ) => Promise<FileManagerSettings>;
    /**
     * Update the FileManager system data..
     */
    update: (
        params: FileManagerSettingsStorageOperationsUpdateParams
    ) => Promise<FileManagerSettings>;
    /**
     * Delete the existing settings.
     */
    delete: () => Promise<void>;
}

/**
 * @category StorageOperations
 * @category FilesStorageOperations
 * @category FilesStorageOperationsParams
 */
export interface FileManagerFilesStorageOperationsCreateParams {
    file: File;
}
/**
 * @category StorageOperations
 * @category FilesStorageOperations
 * @category FilesStorageOperationsParams
 */
export interface FileManagerFilesStorageOperationsUpdateParams {
    original: File;
    file: File;
}
/**
 * @category StorageOperations
 * @category FilesStorageOperations
 * @category FilesStorageOperationsParams
 */
export interface FileManagerFilesStorageOperationsCreateBatchParams {
    files: File[];
}
/**
 * @category StorageOperations
 * @category FilesStorageOperations
 * @category FilesStorageOperationsParams
 */
export interface FileManagerFilesStorageOperationsListParamsWhere {
    // id?: string;
    id_in?: string[];
    // name?: string;
    // name_contains?: string;
    // tag?: string;
    // tag_contains?: string;
    tag_in?: string[];
    search?: string;
    createdBy?: {
        id: string;
        type: string;
    };
    locale?: string;
    tenant?: string;
    private?: boolean;
    // type?: string;
    type_in?: string[];
}
/**
 * @category StorageOperations
 * @category FilesStorageOperations
 * @category FilesStorageOperationsParams
 */
export interface FileManagerFilesStorageOperationsListParams {
    where: FileManagerFilesStorageOperationsListParamsWhere;
    limit: number;
    after: string | null;
}
/**
 * @category StorageOperations
 * @category FilesStorageOperations
 * @category FilesStorageOperationsParams
 */
interface FileManagerFilesStorageOperationsListResponseListMeta {
    hasMoreItems: boolean;
    totalCount: number;
    cursor?: string;
}
export type FileManagerFilesStorageOperationsListResponse = [
    File[],
    FileManagerFilesStorageOperationsListResponseListMeta
];

interface FileManagerFilesStorageOperationsListResponseTagsMeta {
    hasMoreItems: boolean;
    totalCount: number;
    cursor?: string;
}
export type FileManagerFilesStorageOperationsTagsResponse = [
    string[],
    FileManagerFilesStorageOperationsListResponseTagsMeta
];

export interface FileManagerFilesStorageOperationsTagsParamsWhere {
    locale: string;
    tenant?: string;
}
/**
 * @category StorageOperations
 * @category FilesStorageOperations
 * @category FilesStorageOperationsParams
 */
export interface FileManagerFilesStorageOperationsTagsParams {
    where: FileManagerFilesStorageOperationsTagsParamsWhere;
    limit?: number;
    after?: string;
}
/**
 * @category StorageOperations
 * @category FilesStorageOperations
 */
export interface FileManagerFilesStorageOperations {
    /**
     * Get a single file with given ID from the storage.
     */
    get: (id: string) => Promise<File | null>;
    /**
     * Insert the file data into the database.
     */
    create: (params: FileManagerFilesStorageOperationsCreateParams) => Promise<File | null>;
    /**
     * Update the file data in the database.
     */
    update: (params: FileManagerFilesStorageOperationsUpdateParams) => Promise<File | null>;
    /**
     * Delete the file from the database.
     */
    delete: (id: string) => Promise<void>;
    /**
     * Store multiple files at once to the database.
     */
    createBatch: (params: FileManagerFilesStorageOperationsCreateBatchParams) => Promise<File[]>;
    /**
     * Get a list of files filtered by given parameters.
     */
    list: (
        params: FileManagerFilesStorageOperationsListParams
    ) => Promise<FileManagerFilesStorageOperationsListResponse>;
    /**
     * Get a list of all file tags filtered by given parameters.
     */
    tags: (
        params: FileManagerFilesStorageOperationsTagsParams
    ) => Promise<FileManagerFilesStorageOperationsTagsResponse>;
}
