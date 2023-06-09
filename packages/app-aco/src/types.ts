import {
    CmsModel,
    CmsModelField,
    CmsModelFieldSettings
} from "@webiny/app-headless-cms-common/types";

export * from "~/graphql/records/types";

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

export type MovableSearchRecordItem = Pick<SearchRecordItem, "id" | "location">;

export type DeletableSearchRecordItem = Pick<SearchRecordItem, "id" | "location">;

export interface TagItem {
    tag: string;
}

export type Loading<T extends string> = { [P in T]?: boolean };

export type LoadingActions =
    | "INIT"
    | "LIST"
    | "LIST_MORE"
    | "GET"
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "MOVE";

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

export interface DndItemData extends FolderItem {
    isFocused?: boolean;
}

/**
 * This type will be removed when all apps migrate to the CMS.
 * @deprecated
 */
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
