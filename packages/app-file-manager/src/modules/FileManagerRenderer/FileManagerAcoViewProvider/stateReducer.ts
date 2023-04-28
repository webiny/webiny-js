import { FileItem } from "@webiny/app-admin/types";
import { ListDbSort } from "@webiny/app-aco/types";
import { FOLDER_ID_DEFAULT } from "~/constants";
import isEqual from "lodash/isEqual";

interface BaseStateListWhere {
    tags_in?: string[];
    tags_startsWith?: string;
    tags_not_startsWith?: string;
}

export interface StateListWhere extends BaseStateListWhere {
    folderId?: string;
    search?: string;
    createdBy?: string;
    AND?: BaseStateListWhere[];
}

export interface State {
    folderId: string | undefined;
    showingFileDetails: string | null;
    selected: FileItem[];
    hasPreviouslyUploadedFiles: boolean | null;
    listWhere: StateListWhere;
    listSort?: ListDbSort;
    dragging: boolean;
    uploading: boolean;
}

export type Action =
    | {
          type: "setFolderId";
          state: string | undefined;
      }
    | {
          type: "toggleSelected";
          file: FileItem;
      }
    | {
          type: "setSelected";
          files: FileItem[];
      }
    | {
          type: "listWhere";
          state: StateListWhere;
      }
    | {
          type: "listSort";
          state: ListDbSort;
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

export const initializeState = ({ accept, scope, own, identity }: InitParams): State => {
    return {
        folderId: FOLDER_ID_DEFAULT,
        showingFileDetails: null,
        selected: [],
        hasPreviouslyUploadedFiles: null,
        listWhere: {
            ...getScopeWhereParams(scope),
            ...getMimeTypeWhereParams(accept),
            search: undefined,
            createdBy: own ? identity.id : undefined,
            AND: undefined
        },
        listSort: {},
        dragging: false,
        uploading: false
    };
};

export const stateReducer: Reducer = (state: State, action) => {
    const next: State = {
        ...state
    };
    switch (action.type) {
        case "setFolderId": {
            next.folderId = action.state;
            next.listWhere = {
                ...state.listWhere,
                folderId: action.state
            };
            break;
        }
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
        case "listWhere": {
            next.selected = [];
            next.listWhere = {
                ...state.listWhere,
                ...action.state
            };
            break;
        }
        case "listSort": {
            if (!isEqual(state.listSort, action.state)) {
                next.listSort = action.state;
            }
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
