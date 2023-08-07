import { I18NContext } from "@webiny/api-i18n/types";
import { FileStorage } from "./storage/FileStorage";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { SecurityContext, SecurityPermission } from "@webiny/api-security/types";
import { Context } from "@webiny/api/types";
import { FileLifecycleEvents } from "./types/file.lifecycle";
import { File } from "./types/file";
import { Topic } from "@webiny/pubsub/types";
import { CmsContext } from "@webiny/api-headless-cms/types";
export * from "./types/file.lifecycle";
export * from "./types/file";

export interface FileManagerContextObject extends FilesCRUD, SettingsCRUD, SystemCRUD {
    storage: FileStorage;
}

export interface FileManagerContext
    extends Context,
        SecurityContext,
        TenancyContext,
        I18NContext,
        CmsContext {
    fileManager: FileManagerContextObject;
}

export interface FilePermission extends SecurityPermission {
    name: "fm.file";
    rwd?: string;
    own?: boolean;
}

export interface FileInput {
    id: string;
    key: string;
    name: string;
    size: number;
    type: string;
    meta: Record<string, any>;
    location?: {
        folderId: string;
    };
    tags: string[];
    aliases: string[];
    extensions?: Record<string, any>;
}

export interface FileListWhereParams {
    AND?: FileListWhereParams[];
    OR?: FileListWhereParams[];
    [key: string]: any;
}
export interface FilesListOpts {
    search?: string;
    limit?: number;
    after?: string;
    where?: FileListWhereParams;
    sort?: string[];
}

export interface FileListMeta {
    cursor: string | null;
    totalCount: number;
    hasMoreItems: boolean;
}

interface FilesCrudListTagsWhere {
    tag?: string;
    tag_contains?: string;
    tag_in?: string[];
    tag_not_startsWith?: string;
    tag_startsWith?: string;
}
interface FilesCrudListTagsParams {
    where?: FilesCrudListTagsWhere;
    limit?: number;
    after?: string;
}

export interface ListTagsResponse {
    tag: string;
    count: number;
}
export interface FilesCRUD extends FileLifecycleEvents {
    getFile(id: string): Promise<File>;
    listFiles(opts?: FilesListOpts): Promise<[File[], FileListMeta]>;
    listTags(params: FilesCrudListTagsParams): Promise<ListTagsResponse[]>;
    createFile(data: FileInput, meta?: Record<string, any>): Promise<File>;
    updateFile(id: string, data: Partial<FileInput>): Promise<File>;
    deleteFile(id: string): Promise<boolean>;
    createFilesInBatch(data: FileInput[], meta?: Record<string, any>): Promise<File[]>;
}

export interface SystemCRUD {
    onSystemBeforeInstall: Topic;
    onSystemAfterInstall: Topic;
    getVersion(): Promise<string | null>;
    setVersion(version: string): Promise<void>;
    install(args: { srcPrefix: string }): Promise<boolean>;
}

export interface FileManagerSettings {
    tenant: string;
    key: string;
    uploadMinFileSize: number;
    uploadMaxFileSize: number;
    srcPrefix: string;
}

export interface FileManagerSystem {
    version: string;
    tenant: string;
}

export interface OnSettingsBeforeUpdateTopicParams {
    input: Partial<FileManagerSettings>;
    original: FileManagerSettings;
    settings: FileManagerSettings;
}

export interface OnSettingsAfterUpdateTopicParams {
    input: Partial<FileManagerSettings>;
    original: FileManagerSettings;
    settings: FileManagerSettings;
}

export type SettingsCRUD = {
    getSettings(): Promise<FileManagerSettings | null>;
    createSettings(data?: Partial<FileManagerSettings>): Promise<FileManagerSettings>;
    updateSettings(data: Partial<FileManagerSettings>): Promise<FileManagerSettings>;
    deleteSettings(): Promise<boolean>;

    onSettingsBeforeUpdate: Topic<OnSettingsBeforeUpdateTopicParams>;
    onSettingsAfterUpdate: Topic<OnSettingsAfterUpdateTopicParams>;
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
    /**
     * The system data to be updated.
     */
    original: FileManagerSystem;
    /**
     * The system data with the updated fields.
     */
    data: FileManagerSystem;
}
/**
 * @category StorageOperations
 * @category SystemStorageOperations
 * @category SystemStorageOperationsParams
 */
export interface FileManagerSystemStorageOperationsCreateParams {
    /**
     * The system fields.
     */
    data: FileManagerSystem;
}

export interface FileManagerSystemStorageOperationsGetParams {
    tenant: string;
}

/**
 * @category StorageOperations
 * @category SystemStorageOperations
 */
export interface FileManagerSystemStorageOperations {
    /**
     * Get the FileManager system data.
     */
    get: (params: FileManagerSystemStorageOperationsGetParams) => Promise<FileManagerSystem | null>;
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
    /**
     * Original settings to be updated.
     */
    original: FileManagerSettings;
    /**
     * The settings with the updated fields.
     */
    data: FileManagerSettings;
}
/**
 * @category StorageOperations
 * @category SettingsStorageOperations
 * @category SettingsStorageOperationsParams
 */
export interface FileManagerSettingsStorageOperationsCreateParams {
    /**
     * The settings fields.
     */
    data: FileManagerSettings;
}

export interface FileManagerStorageOperationsGetSettingsParams {
    tenant: string;
}

export interface FileManagerStorageOperationsDeleteSettings {
    tenant: string;
}

/**
 * @category StorageOperations
 * @category SettingsStorageOperations
 */
export interface FileManagerSettingsStorageOperations {
    /**
     * Get the FileManager system data.
     */
    get: (
        params: FileManagerStorageOperationsGetSettingsParams
    ) => Promise<FileManagerSettings | null>;
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
    delete: (params: FileManagerStorageOperationsDeleteSettings) => Promise<void>;
}

/**
 * @category StorageOperations
 * @category FilesStorageOperations
 * @category FilesStorageOperationsParams
 */
export interface FileManagerFilesStorageOperationsGetParams {
    where: {
        id: string;
        tenant: string;
        locale: string;
    };
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
export interface FileManagerFilesStorageOperationsDeleteParams {
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
    [key: string]: any;
}
/**
 * @category StorageOperations
 * @category FilesStorageOperations
 * @category FilesStorageOperationsParams
 */
export interface FileManagerFilesStorageOperationsListParams {
    where: FileManagerFilesStorageOperationsListParamsWhere;
    sort: string[];
    limit: number;
    after: string | null;
    search?: string;
}

/**
 * @category StorageOperations
 * @category FilesStorageOperations
 * @category FilesStorageOperationsParams
 */
export interface FileManagerFilesStorageOperationsListResponseMeta {
    hasMoreItems: boolean;
    totalCount: number;
    cursor: string | null;
}
export type FileManagerFilesStorageOperationsListResponse = [
    File[],
    FileManagerFilesStorageOperationsListResponseMeta
];

export interface FileManagerFilesStorageOperationsTagsResponse {
    tag: string;
    count: number;
}

export interface FileManagerFilesStorageOperationsTagsParamsWhere extends FilesCrudListTagsWhere {
    locale: string;
    tenant: string;
}
/**
 * @category StorageOperations
 * @category FilesStorageOperations
 * @category FilesStorageOperationsParams
 */
export interface FileManagerFilesStorageOperationsTagsParams {
    where: FileManagerFilesStorageOperationsTagsParamsWhere;
    limit: number;
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
    get: (params: FileManagerFilesStorageOperationsGetParams) => Promise<File | null>;
    /**
     * Insert the file data into the database.
     */
    create: (params: FileManagerFilesStorageOperationsCreateParams) => Promise<File>;
    /**
     * Update the file data in the database.
     */
    update: (params: FileManagerFilesStorageOperationsUpdateParams) => Promise<File>;
    /**
     * Delete the file from the database.
     */
    delete: (params: FileManagerFilesStorageOperationsDeleteParams) => Promise<void>;
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
    ) => Promise<FileManagerFilesStorageOperationsTagsResponse[]>;
}

export interface FileManagerAliasesStorageOperations {
    storeAliases(file: File): Promise<void>;
    deleteAliases(file: File): Promise<void>;
}

export interface FileManagerStorageOperations<TContext = FileManagerContext> {
    beforeInit?: (context: TContext) => Promise<void>;
    files: FileManagerFilesStorageOperations;
    aliases: FileManagerAliasesStorageOperations;
    settings: FileManagerSettingsStorageOperations;
    system: FileManagerSystemStorageOperations;
}
