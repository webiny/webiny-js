export interface FolderItem {
    id: string;
    name: string;
    slug: string;
    parentId?: string;
}

export interface ListFoldersResponse {
    folders: {
        listFolders: {
            folders: FolderItem[];
        };
    };
}
