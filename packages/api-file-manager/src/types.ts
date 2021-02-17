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
        };
    }
>;

export type FilePermission = SecurityPermission<{
    name: "fm.file";
    rwd?: string;
    own?: boolean;
}>;

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

export type Settings = {
    key: string;
    installed: boolean;
    uploadMinFileSize: number;
    uploadMaxFileSize: number;
    srcPrefix: string;
    webinyVersion: string;
};

export type SettingsCRUD = {
    getSettings(): Promise<Settings>;
    createSettings(data?: Partial<Settings>): Promise<Settings>;
    updateSettings(data: Partial<Settings>): Promise<Settings>;
    deleteSettings(): Promise<boolean>;
};
