export interface FolderItem {
    id: string;
    title: string;
    slug: string;
    type: string;
    parentId: string | null;
    createdOn: string;
    createdBy: {
        id: string;
        displayName: string;
    };
    savedOn: string;
}

export type GenericSearchData = {
    [key: string]: any;
};

export interface Location {
    folderId: string;
}

export interface SearchRecordItem<TData extends GenericSearchData = GenericSearchData> {
    id: string;
    type: string;
    title: string;
    content: string;
    location: Location;
    data: TData;
    tags: string[];
}

export type TagItem = {
    tag: string;
};

export type Loading<T extends string> = { [P in T]?: boolean };

export type LoadingActions = "INIT" | "LIST" | "LIST_MORE" | "GET" | "CREATE" | "UPDATE" | "DELETE";

export interface Error {
    code: string;
    message: string;
    data: any;
}

export type Meta<T> = Record<string, { [P in keyof T]: T[P] }>;

export enum ListDbSortDirection {
    ASC = "ASC",
    DESC = "DESC"
}

export enum ListTableSortDirection {
    asc = "asc",
    desc = "desc"
}

export type ListDbSort = Record<string, ListDbSortDirection>;

export interface ListTableSort {
    fields: string[];
    orders: ListTableSortDirection[];
}

export interface ListMeta {
    cursor: string | null;
    totalCount: number;
    hasMoreItems: boolean;
}

export interface ListFoldersResponse {
    aco: {
        listFolders: {
            data: FolderItem[] | null;
            error: Error | null;
        };
    };
}

export interface ListFoldersQueryVariables {
    type: string;
    limit: number;
}

export interface GetFolderResponse {
    aco: {
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
    aco: {
        updateFolder: {
            data: FolderItem;
            error: Error | null;
        };
    };
}

export interface UpdateFolderVariables {
    id: string;
    data: Partial<Omit<FolderItem, "id" | "createdOn" | "createdBy" | "savedOn">>;
}

export interface CreateFolderResponse {
    aco: {
        createFolder: {
            data: FolderItem;
            error: Error | null;
        };
    };
}

export interface CreateFolderVariables {
    data: Omit<FolderItem, "id" | "createdOn" | "createdBy" | "savedOn">;
}

export interface DeleteFolderVariables {
    id: string;
}

export interface DeleteFolderResponse {
    aco: {
        deleteFolder: {
            data: boolean;
            error: Error | null;
        };
    };
}

export interface ListSearchRecordsResponse {
    search: {
        listRecords: {
            data: SearchRecordItem[] | null;
            meta: ListMeta | null;
            error: Error | null;
        };
    };
}

export interface ListSearchRecordsWhereQueryVariables {
    tags_in?: string[];
    tags_startsWith?: string;
    tags_not_startsWith?: string;
}

export interface ListSearchRecordsQueryVariables {
    where: ListSearchRecordsWhereQueryVariables & {
        type: string;
        location?: Location;
        createdBy?: string;
        AND?: ListSearchRecordsWhereQueryVariables[];
        OR?: ListSearchRecordsWhereQueryVariables[];
    };
    search?: string;
    limit?: number;
    after?: string | null;
    sort?: ListDbSort;
}

export interface ListTagsResponse {
    search: {
        listTags: {
            data: string[] | null;
            error: Error | null;
        };
    };
}

export interface ListTagsWhereQueryVariables {
    tags_in?: string[];
    tags_startsWith?: string;
    tags_not_startsWith?: string;
}

export interface ListTagsQueryVariables {
    where: ListTagsWhereQueryVariables & {
        type: string;
        AND?: [ListTagsWhereQueryVariables];
        OR?: [ListTagsWhereQueryVariables];
    };
}

export interface GetSearchRecordResponse {
    search: {
        getRecord: {
            data: SearchRecordItem | null;
            error: Error | null;
        };
    };
}

export interface GetSearchRecordQueryVariables {
    id: string;
}

export interface CreateSearchRecordResponse {
    search: {
        createRecord: {
            data: SearchRecordItem;
            error: Error | null;
        };
    };
}

export interface CreateSearchRecordVariables {
    data: Omit<SearchRecordItem, "id" | "createdOn" | "createdBy" | "savedOn">;
}

export interface UpdateSearchRecordResponse {
    search: {
        updateRecord: {
            data: SearchRecordItem;
            error: Error | null;
        };
    };
}

export interface UpdateSearchRecordVariables {
    id: string;
    data: Pick<SearchRecordItem, "location" | "title" | "content" | "data">;
}

export interface DeleteSearchRecordVariables {
    id: string;
}

export interface DeleteSearchRecordResponse {
    search: {
        deleteRecord: {
            data: boolean;
            error: Error | null;
        };
    };
}

export interface DndItemData extends FolderItem {
    isFocused?: boolean;
}
