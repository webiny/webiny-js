import type {
    CmsModel,
    CmsModelField,
    CmsModelFieldSettings
} from "@webiny/app-headless-cms-common/types/index.js";

export type { CmsIdentity } from "@webiny/app-headless-cms-common/types/index.js";
export type * from "@webiny/shared-aco/flp/flp.types.js";
export type * from "~/graphql/records/types.js";
export type * from "~/table.types.js";

export interface FolderLevelPermissionsTarget<TMeta = Record<string, any>> {
    id: string;
    target: string;
    name: string;
    type: string;
    meta: TMeta;
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

export const LoadingActionsEnum = {
    init: "INIT",
    list: "LIST",
    listMore: "LIST_MORE",
    get: "GET",
    create: "CREATE",
    update: "UPDATE",
    delete: "DELETE",
    move: "MOVE"
};

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
