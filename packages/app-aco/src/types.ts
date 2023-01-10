export interface FolderItem {
    id: string;
    name: string;
    slug: string;
    type: string;
    parentId: string | null;
    createdOn: string;
    createdBy: {
        id: string;
        displayName: string;
    };
}

export interface LinkItem {
    id: string;
    linkId: string;
    folderId: string;
}

export type Loading<T extends string> = { [P in T]?: boolean };

export type LoadingActions = "INIT" | "LIST" | "LIST_MORE" | "GET" | "CREATE" | "UPDATE" | "DELETE";

export interface Error {
    code: string;
    message: string;
    data: any;
}

export type Meta<T> = Record<string, { [P in keyof T]: T[P] }>;

export interface ListMeta {
    cursor: string | null;
    totalCount: number;
    hasMoreItems: boolean;
}

export interface ListFoldersResponse {
    folders: {
        listFolders: {
            data: FolderItem[] | null;
            error: Error | null;
        };
    };
}

export interface ListFoldersQueryVariables {
    type: string;
}

export interface GetFolderResponse {
    folders: {
        getFolder: {
            data: FolderItem | null;
            error: Error | null;
        };
    };
}

export interface GetFolderQueryVariables {
    id: string;
}

export interface UpdateFolderResponse {
    folders: {
        updateFolder: {
            data: FolderItem;
            error: Error | null;
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
            error: Error | null;
        };
    };
}

export interface CreateFolderVariables {
    data: Omit<FolderItem, "id">;
}

export interface DeleteFolderVariables {
    id: string;
}

export interface DeleteFolderResponse {
    folders: {
        deleteFolder: {
            data: boolean;
            error: Error | null;
        };
    };
}

export interface ListLinksResponse {
    folders: {
        listLinks: {
            data: LinkItem[] | null;
            meta: ListMeta | null;
            error: Error | null;
        };
    };
}

export interface ListLinksQueryVariables {
    folderId: string;
    limit?: number;
    after?: string | null;
}

export interface GetLinkResponse {
    folders: {
        getLink: {
            data: LinkItem | null;
            error: Error | null;
        };
    };
}

export interface GetLinkQueryVariables {
    id: string;
}

export interface CreateLinkResponse {
    folders: {
        createLink: {
            data: LinkItem;
            error: Error | null;
        };
    };
}

export interface CreateLinkVariables {
    data: Omit<LinkItem, "linkId">;
}

export interface UpdateLinkResponse {
    folders: {
        updateLink: {
            data: LinkItem;
            error: Error | null;
        };
    };
}

export interface UpdateLinkVariables {
    id: string;
    data: Pick<LinkItem, "folderId">;
}

export interface DeleteLinkVariables {
    id: string;
}

export interface DeleteLinkResponse {
    folders: {
        deleteLink: {
            data: boolean;
            error: Error | null;
        };
    };
}

export interface DndItemData extends FolderItem {
    isFocused?: boolean;
}
