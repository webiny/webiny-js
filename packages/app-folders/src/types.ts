export interface FolderItem {
    id: string;
    name: string;
    slug: string;
    type: string;
    parentId: string | null;
}

export interface FolderError {
    code: string;
    message: string;
    data: any;
}

export interface ListFoldersResponse {
    folders: {
        listFolders: {
            data: FolderItem[] | null;
            error: FolderError | null;
        };
    };
}

export interface ListFoldersQueryVariables {
    type: string;
}

export interface UpdateFolderResponse {
    folders: {
        updateFolder: {
            data: FolderItem;
            error: FolderError | null;
        };
    };
}

export interface UpdateFolderVariables {
    id: string;
    data: Partial<Omit<FolderItem, "id">>;
}

export interface CreateFolderResponse {
    folders: {
        createFolder: {
            data: FolderItem;
            error: FolderError | null;
        };
    };
}

export interface DeleteFolderVariables {
    id: string;
}

export interface DeleteFolderResponse {
    folders: {
        deleteFolder: {
            data: boolean;
            error: FolderError | null;
        };
    };
}

export interface CreateFolderVariables {
    data: Omit<FolderItem, "id">;
}

export interface DndItemData extends FolderItem {
    isFocused?: boolean;
}
