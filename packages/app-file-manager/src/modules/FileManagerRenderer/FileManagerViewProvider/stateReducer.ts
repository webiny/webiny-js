import { FileItem } from "@webiny/app-admin/types";
import { ListDbSort } from "@webiny/app-aco/types";

export enum ListFilesSort {
    CREATED_ON_ASC,
    CREATED_ON_DESC,
    SIZE_ASC,
    SIZE_DESC
}

export interface StateQueryParams {
    createdBy?: string;
    search?: string;
    types?: string[];
    limit?: number;
    sort?: ListDbSort;
    tags?: string[];
    scope?: string;
}

export interface State {
    showingFileDetails: string | null;
    selected: FileItem[];
    hasPreviouslyUploadedFiles: boolean | null;
    queryParams: StateQueryParams;
    dragging: boolean;
    uploading: boolean;
}

export type Action =
    | {
          type: "toggleSelected";
          file: FileItem;
      }
    | {
          type: "setSelected";
          files: FileItem[];
      }
    | {
          type: "queryParams";
          queryParams: StateQueryParams;
      }
    | {
          type: "showFileDetails";
          id: string | null;
      }
    | {
          type: "dragging";
          state: boolean;
      }
    | {
          type: "hasPreviouslyUploadedFiles";
          state: boolean;
      }
    | {
          type: "uploading";
          state: boolean;
      };

interface Reducer {
    (prev: State, action: Action): State;
}

interface InitParams {
    accept?: string[];
    tags?: string[];
    scope?: string;
    own?: boolean;
    identity: any;
}

const DEFAULT_SCOPE = "scope:";

export const getWhere = (scope: string | undefined) => {
    if (!scope) {
        return {
            tag_not_startsWith: DEFAULT_SCOPE
        };
    }
    return {
        tag_startsWith: scope
    };
};

export const initializeState = ({ accept, tags, scope, own, identity }: InitParams): State => {
    return {
        showingFileDetails: null,
        selected: [],
        hasPreviouslyUploadedFiles: null,
        queryParams: {
            scope,
            limit: 50,
            sort: undefined,
            types: accept?.length ? accept : undefined,
            tags: tags?.length ? tags : undefined,
            createdBy: own ? identity.id : undefined
        },
        dragging: false,
        uploading: false
    };
};

export const stateReducer: Reducer = (state: State, action) => {
    const next: State = {
        ...state
    };
    switch (action.type) {
        case "setSelected": {
            next.selected = action.files;
            break;
        }
        case "toggleSelected": {
            const existingIndex = state.selected.findIndex(item => item.src === action.file.src);
            if (existingIndex < 0) {
                next.selected.push(action.file);
            } else {
                next.selected.splice(existingIndex, 1);
            }
            break;
        }
        case "queryParams": {
            next.selected = [];
            next.queryParams = {
                ...state.queryParams,
                ...action.queryParams,
                types: state.queryParams.types,
                limit: 50
            };
            break;
        }
        case "showFileDetails": {
            next.showingFileDetails = action.id;
            break;
        }
        case "dragging": {
            next.dragging = action.state;
            break;
        }
        case "hasPreviouslyUploadedFiles": {
            next.hasPreviouslyUploadedFiles = action.state;
            break;
        }
        case "uploading": {
            next.uploading = action.state;
            break;
        }
    }

    return next;
};
