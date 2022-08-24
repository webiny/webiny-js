import { Context } from "@webiny/api/types";

export interface CreatedBy {
    id: string;
    type: string;
    displayName: string | null;
}

export type Type = "pages" | "cms" | "files";

export interface Folder {
    id: string;
    name: string;
    slug: string;
    type: Type;
    createdOn: string;
    createdBy: CreatedBy;
    tenant: string;
    locale: string;
    webinyVersion: string;
}

export interface FolderInput {
    name: string;
    slug: string;
    type: Type;
}

export interface FoldersContext extends Context {
    folders: Folders;
}

export interface Folders {
    getFolder(id: string): Promise<Folder>;
    listFolders(params: FoldersCRUDListParams): Promise<Folder[]>;
    createFolder(params: FolderInput): Promise<Folder>;
    updateFolder(id: string, params: FolderInput): Promise<Folder>;
    deleteFolder(id: string): Promise<boolean>;
}

export interface FoldersStorageOperations {
    getFolder(id: string): Promise<Folder>;
    listFolders(params: FoldersCRUDListParams): Promise<Folder[]>;
    createFolder(params: FolderInput): Promise<Folder>;
    updateFolder(id: string, params: FolderInput): Promise<Folder>;
    deleteFolder(id: string): Promise<boolean>;
}

export interface DefaultCrudListParams {
    limit?: number;
    after?: string;
    sort?: string[];
}

export interface FoldersCRUDListParams extends DefaultCrudListParams {
    where: {
        type: Type;
    };
}
