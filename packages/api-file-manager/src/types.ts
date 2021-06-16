import { Context } from "@webiny/handler/types";
import { ElasticSearchClientContext } from "@webiny/api-plugin-elastic-search-client/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { FileStorage } from "./plugins/FileStorage";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { SecurityPermission } from "@webiny/api-security/types";
import { DbContext } from "@webiny/handler-db/types";

export type FileManagerContext = Context<
    TenancyContext,
    I18NContentContext,
    DbContext,
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

export type Settings = {
    key: string;
    uploadMinFileSize: number;
    uploadMaxFileSize: number;
    srcPrefix: string;
};

export type SettingsCRUD = {
    getSettings(): Promise<Settings>;
    createSettings(data?: Partial<Settings>): Promise<Settings>;
    updateSettings(data: Partial<Settings>): Promise<Settings>;
    deleteSettings(): Promise<boolean>;
};
