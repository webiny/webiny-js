import {
    CmsModel,
    CmsModelField,
    CmsModelFieldSettings
} from "@webiny/app-headless-cms-common/types";

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

export interface TagItem {
    tag: string;
}

export type Loading<T extends string> = { [P in T]?: boolean };

export type LoadingActions = "INIT" | "LIST" | "LIST_MORE" | "GET" | "CREATE" | "UPDATE" | "DELETE";

export interface AcoError {
    code: string;
    message: string;
    data?: Record<string, any> | null;
}

export type Meta<T> = Record<string, { [P in keyof T]: T[P] }>;

export type ListSearchRecordsSortItem = `${string}_ASC` | `${string}_DESC`;
export type ListSearchRecordsSort = ListSearchRecordsSortItem[];

export interface ListMeta {
    cursor: string | null;
    totalCount: number;
    hasMoreItems: boolean;
}

export interface ListFoldersResponse {
    aco: {
        listFolders: {
            data: FolderItem[] | null;
            error: AcoError | null;
        };
    };
}

export interface ListFoldersQueryVariables {
    type: string;
    limit: number;
    sort?: Record<string, any>;
    after?: string | null;
}

export interface GetFolderResponse {
    aco: {
        getFolder: {
            data: FolderItem | null;
            error: AcoError | null;
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
            error: AcoError | null;
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
            error: AcoError | null;
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
            error: AcoError | null;
        };
    };
}

export interface ListSearchRecordsResponse {
    search: {
        listRecords: {
            data: SearchRecordItem[] | null;
            meta: ListMeta | null;
            error: AcoError | null;
        };
    };
}

export interface ListSearchRecordsWhereQueryVariables {
    location?: Partial<Location>;
    createdBy?: string;
    tags_in?: string[];
    tags_startsWith?: string;
    tags_not_startsWith?: string;
    AND?: ListSearchRecordsWhereQueryVariables[];
    OR?: ListSearchRecordsWhereQueryVariables[];
}

export interface ListSearchRecordsQueryVariables {
    where?: ListSearchRecordsWhereQueryVariables;
    search?: string;
    limit?: number;
    after?: string | null;
    sort?: ListSearchRecordsSort;
}

export interface ListTagsResponse {
    search: {
        listTags: {
            data: TagItem[] | null;
            error: AcoError | null;
        };
    };
}

export interface ListTagsWhereQueryVariables {
    tags_in?: string[];
    tags_startsWith?: string;
    tags_not_startsWith?: string;
    AND?: ListTagsWhereQueryVariables[];
    OR?: ListTagsWhereQueryVariables[];
}

export interface ListTagsQueryVariables {
    where?: ListTagsWhereQueryVariables;
}

export interface GetSearchRecordResponse {
    search: {
        getRecord: {
            data: SearchRecordItem | null;
            error: AcoError | null;
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
            error: AcoError | null;
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
            error: AcoError | null;
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
            error: AcoError | null;
        };
    };
}

export interface DndItemData extends FolderItem {
    isFocused?: boolean;
}

export type AcoAppMode = "aco" | "cms";

/**
 * Apps.
 */
export interface AcoModel extends CmsModel {
    fields: AcoModelField[];
}

export interface AcoModelFieldSettingsAco {
    enabled?: boolean;
    header?: boolean;
}

export interface AcoModelFieldSettings {
    aco?: AcoModelFieldSettingsAco;
}

export interface AcoModelField extends CmsModelField {
    settings?: CmsModelFieldSettings & AcoModelFieldSettings;
}

export interface AcoApp {
    id: string;
    model: AcoModel;
    getFields: () => AcoModelField[];
}
