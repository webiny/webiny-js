export interface FolderItem {
    id: string;
    name: string;
    slug: string;
    type: string;
    parentId?: string;
}

export interface ListFoldersResponse {
    folders: {
        listFolders: {
            data: FolderItem[];
        };
    };
}

export interface ListFoldersQueryVariables {
    type: string;
}

export interface UpdateFolderResponse {
    folders: {
        updateFolder: {
            data: FolderItem[];
            error?: Error | null;
        };
    };
}

export interface UpdateFolderVariables {
    id: string;
    data: Partial<FolderItem>;
}

export interface CreateFolderResponse {
    folders: {
        createFolder: {
            data: FolderItem;
            error?: Error | null;
        };
    };
}

export interface CreateFolderVariables {
    data: Partial<FolderItem>;
}

export interface DndItemData extends FolderItem {
    isFocused?: boolean;
}
