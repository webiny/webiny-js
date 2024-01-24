import {
    CmsIdentity,
    CmsModel,
    CmsModelField,
    CmsModelFieldSettings
} from "@webiny/app-headless-cms-common/types";

export { CmsIdentity } from "@webiny/app-headless-cms-common/types";
export * from "~/graphql/records/types";
export * from "~/table.types";
export type FolderAccessLevel = "owner" | "viewer" | "editor" | "public";

export interface FolderPermission {
    target: `admin:${string}` | `team:${string}`;
    level: FolderAccessLevel;
    inheritedFrom?: string;
}

export interface FolderLevelPermissionsTarget<TMeta = Record<string, any>> {
    id: string;
    target: string;
    name: string;
    type: string;
    meta: TMeta;
}

export interface FolderItem {
    id: string;
    title: string;
    slug: string;
    permissions: FolderPermission[];
    hasNonInheritedPermissions: boolean;
    canManagePermissions: boolean;
    canManageStructure: boolean;
    canManageContent: boolean;
    type: string;
    parentId: string | null;
    createdBy: CmsIdentity;
    createdOn: string;
    savedBy: CmsIdentity;
    savedOn: string;
    modifiedBy: CmsIdentity | null;
    modifiedOn: string | null;
}

export type GenericSearchData = {
    [key: string]: any;
};

export interface Location {
    folderId: string;
}

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
    data: Partial<
        Omit<
            FolderItem,
            "id" | "createdOn" | "createdBy" | "savedOn" | "savedBy" | "modifiedOn" | "modifiedBy"
        >
    >;
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
    data: Omit<
        FolderItem,
        "id" | "createdOn" | "createdBy" | "savedOn" | "savedBy" | "modifiedOn" | "modifiedBy"
    >;
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

export interface DndFolderItemData {
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
