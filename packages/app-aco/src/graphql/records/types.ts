import { AcoError, ListMeta, ListSearchRecordsSort, SearchRecordItem, TagItem } from "~/types";

export interface UpdateSearchRecordResponse {
    search: {
        updateRecord: {
            data: SearchRecordItem | null;
            error: AcoError | null;
        };
    };
}

export interface UpdateSearchRecordVariables {
    id: string;
    data: Pick<SearchRecordItem, "location" | "title" | "content" | "data">;
}

export interface MoveSearchRecordResponse {
    search: {
        moveRecord: {
            data: boolean | null;
            error: AcoError | null;
        };
    };
}

export interface MoveSearchRecordVariables {
    id: string;
    folderId: string;
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

export interface ListTagsResponse {
    search: {
        content: {
            data: TagItem[] | null;
            error: AcoError | null;
        };
    };
}

export interface ListSearchRecordsResponse {
    search: {
        content: {
            data: SearchRecordItem[] | null;
            meta: ListMeta | null;
            error: AcoError | null;
        };
    };
}

interface ListSearchRecordsWhereLocationQueryVariables {
    folderId?: string;
    folderId_in?: string[];
    folderId_not_in?: string[];
}

export interface ListSearchRecordsWhereQueryVariables {
    location?: ListSearchRecordsWhereLocationQueryVariables;
    wbyAco_location?: ListSearchRecordsWhereLocationQueryVariables;
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

export interface GetSearchRecordResponse {
    search: {
        content: {
            data: SearchRecordItem | null;
            error: AcoError | null;
        };
    };
}

export interface GetSearchRecordQueryVariables {
    entryId: string;
}

export interface DeleteSearchRecordVariables {
    id: string;
}

export interface DeleteSearchRecordResponse {
    search: {
        content: {
            data: boolean;
            error: AcoError | null;
        };
    };
}

export interface CreateSearchRecordResponse {
    search: {
        content: {
            data: SearchRecordItem | null;
            error: AcoError | null;
        };
    };
}

export interface CreateSearchRecordVariables {
    data: Omit<
        SearchRecordItem,
        "id" | "createdOn" | "savedOn" | "modifiedOn" | "createdBy" | "savedBy" | "modifiedBy"
    >;
}
