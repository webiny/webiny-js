import { Context } from "@webiny/handler/types";
import { SecurityContext } from "@webiny/api-security/types";
import { HttpContext } from "@webiny/handler-http/types";
import { DbContext } from "@webiny/handler-db/types";
import { ElasticSearchClientContext } from "@webiny/api-plugin-elastic-search-client/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { FileStorage } from "./plugins/FileStorage";
import { TenancyContext } from "@webiny/api-security-tenancy/types";

export type BaseContext = HttpContext &
    SecurityContext &
    TenancyContext &
    I18NContentContext &
    DbContext &
    ElasticSearchClientContext;

export type FileManagerContext = {
    fileManager: {
        files: FilesCRUD;
        fileManagerSettings: FileManagerSettingsCRUD;
        storage: FileStorage;
    };
};

export type FileManagerResolverContext = Context<BaseContext, FileManagerContext>;

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

export type FileCreateData = {
    key: string;
    name: string;
    size: number;
    type: string;
    meta: Record<string, any>;
    tags: [string];
};

export type FilesCRUD = {
    getFile(id: string): Promise<File>;
    listFiles({
        sort,
        limit
    }: {
        sort?: Sort;
        limit?: number;
        [key: string]: any;
    }): Promise<File[]>;
    createFile(data: FileCreateData): Promise<File>;
    updateFile(id: string, data: Partial<FileCreateData>): Promise<File>;
    deleteFile(id: string): Promise<boolean>;
    createFilesInBatch(data: FileCreateData[]): Promise<File[]>;
};

export type FileManagerSettings = {
    key: string;
    installed: boolean;
    uploadMinFileSize: number;
    uploadMaxFileSize: number;
    srcPrefix: string;
};

export type FileManagerSettingsCRUD = {
    getSettings(): Promise<FileManagerSettings>;
    createSettings(data: Partial<FileManagerSettings>): Promise<FileManagerSettings>;
    updateSettings(data: Partial<FileManagerSettings>): Promise<FileManagerSettings>;
    deleteSettings(): Promise<boolean>;
};
