import type { FileStorage } from "./storage/FileStorage.js";
import type { Context } from "@webiny/api/types.js";
import type { FileLifecycleEvents } from "./types/file.lifecycle.js";
import type { CreatedBy, File } from "./types/file.js";
import type { Topic } from "@webiny/pubsub/types.js";
import type { CmsContext, CmsEntryListSort } from "@webiny/api-headless-cms/types/index.js";
import type { Context as TasksContext } from "@webiny/tasks/types.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

export type * from "./types/file.lifecycle.js";
export type * from "./types/file.js";
export type * from "./types/file.js";

export interface FileManagerContextObject extends FilesCRUD, SettingsCRUD {
    storage: FileStorage;
}

export interface FileManagerContext extends Context, ApiCoreContext, CmsContext, TasksContext {
    fileManager: FileManagerContextObject;
}

export interface FilePermission extends SecurityPermission {
    name: "fm.file";
    rwd?: string;
    own?: boolean;
}

export interface SettingsPermission extends SecurityPermission {
    name: "fm.setting";
}

export interface FileInput {
    id: string;

    // In the background, we're actually mapping these to entry-level fields.
    // This is fine since we don't use revisions for files.
    createdOn?: string | Date | null;
    modifiedOn?: string | Date | null;
    savedOn?: string | Date | null;
    createdBy?: CreatedBy | null;
    modifiedBy?: CreatedBy | null;
    savedBy?: CreatedBy | null;

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
    sort?: CmsEntryListSort;
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

export interface FileManagerSettings {
    tenant: string;
    uploadMinFileSize: number;
    uploadMaxFileSize: number;
    srcPrefix: string;
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
 * @category FilesStorageOperations
 * @category FilesStorageOperationsParams
 */
export interface FileManagerFilesStorageOperationsListParamsWhere {
    [key: string]: any;
}

export interface FileManagerFilesStorageOperationsTagsParamsWhere extends FilesCrudListTagsWhere {
    tenant: string;
}

export interface FileAliasesStorageOperations {
    storeAliases(file: File): Promise<void>;
    deleteAliases(file: File): Promise<void>;
}

export interface FileManagerStorageOperations {
    aliases: FileAliasesStorageOperations;
}
