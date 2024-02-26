import { FileItem } from "@webiny/app-admin/types";
import { ListFilesSort } from "~/modules/FileManagerApiProvider/graphql";
import { Settings } from "~/types";

export interface State {
    activeTags: string[];
    dragging: boolean;
    filters: Record<string, any> | undefined;
    isSearch: boolean;
    limit: number;
    listSort?: ListFilesSort;
    listTable: boolean;
    searchLabel: string;
    searchQuery: string;
    selected: FileItem[];
    selection: {
        anchor?: number | undefined;
        focus?: number | undefined;
    };
    settings: Settings | undefined;
    showingFileDetails: string | null;
    showingFilters: boolean;
    tagsFilterMode: "AND" | "OR";
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
        limit: 50,
        listSort: [],
        listTable: false,
        searchLabel: "",
        searchQuery: "",
        selected: [],
        selection: {},
        settings: undefined,
        showingFileDetails: null,
        showingFilters: false,
        tagsFilterMode: "OR"
    };
};
