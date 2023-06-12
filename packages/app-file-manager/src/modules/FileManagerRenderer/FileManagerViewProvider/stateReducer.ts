import { FileItem } from "@webiny/app-admin/types";
import {
    ListFilesSort,
    ListFilesWhereQueryVariables
} from "~/modules/FileManagerApiProvider/graphql";

export interface State {
    folderId: string | undefined;
    limit: number;
    activeTags: string[];
    filters: Record<string, any> | undefined;
    showingFileDetails: string | null;
    showingFilters: boolean;
    loadingFileDetails: boolean;
    selected: FileItem[];
    searchQuery: string;
    hasPreviouslyUploadedFiles: boolean | null;
    listWhere: ListFilesWhereQueryVariables;
    listSort?: ListFilesSort;
    dragging: boolean;
}

interface InitParams {
    folderId: string;
    accept?: string[];
    tags?: string[];
    scope?: string;
    own?: boolean;
    identity: any;
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

export const getMimeTypeWhereParams = (mimes: string[] | undefined) => {
    if (!mimes || !mimes.length) {
        return;
    }

    return {
        tags_in: mimes.map(mime => `mime:${mime}`)
    };
};

export const initializeState = ({ accept, scope, own, identity, folderId }: InitParams): State => {
    return {
        folderId,
        limit: 50,
        activeTags: [],
        filters: undefined,
        showingFileDetails: null,
        showingFilters: false,
        searchQuery: "",
        loadingFileDetails: false,
        selected: [],
        hasPreviouslyUploadedFiles: null,
        listWhere: {
            ...getScopeWhereParams(scope),
            ...getMimeTypeWhereParams(accept),
            createdBy: own ? identity.id : undefined,
            AND: []
        },
        listSort: [],
        dragging: false
    };
};
