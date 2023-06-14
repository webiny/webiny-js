import { FileItem } from "@webiny/app-admin/types";
import { ListFilesSort } from "~/modules/FileManagerApiProvider/graphql";
import { Settings } from "~/types";

export interface State {
    activeTags: string[];
    dragging: boolean;
    filters: Record<string, any> | undefined;
    hasPreviouslyUploadedFiles: boolean | null;
    isSearch: boolean;
    limit: number;
    listSort?: ListFilesSort;
    listTable: boolean;
    loadingFileDetails: boolean;
    searchLabel: string;
    searchQuery: string;
    selected: FileItem[];
    settings: Settings | undefined;
    showingFileDetails: string | null;
    showingFilters: boolean;
}
const DEFAULT_SCOPE = "scope:";

export const getScopeWhereParams = (scope: string | undefined) => {
    if (!scope) {
        return {
            tags_not_startsWith: DEFAULT_SCOPE
        };
    }
    return {
        tags_startsWith: scope
    };
};

export const initializeState = (): State => {
    return {
        activeTags: [],
        dragging: false,
        isSearch: false,
        filters: undefined,
        hasPreviouslyUploadedFiles: null,
        limit: 50,
        listSort: [],
        listTable: false,
        loadingFileDetails: false,
        searchLabel: "",
        searchQuery: "",
        selected: [],
        settings: undefined,
        showingFileDetails: null,
        showingFilters: false
    };
};
