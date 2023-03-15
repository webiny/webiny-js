import { FileItem } from "~/components/FileManager/types";
import { getWhere } from "~/components/FileManager/FileManagerContext";

export enum ListFilesSort {
    CREATED_ON_ASC,
    CREATED_ON_DESC,
    SIZE_ASC,
    SIZE_DESC
}

export interface StateQueryParams {
    types: string[];
    limit: number;
    sort: number;
    tags: string[];
    scope?: string;
    where: Record<string, any>;
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
          type: "queryParams";
          queryParams: StateQueryParams;
      }
    | {
          type: "showFileDetails";
          src: string | null;
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
    accept: string[];
    tags: string[];
    scope?: string;
    own?: boolean;
    identity: any;
}

export const initializeState = ({ accept, tags, scope, own, identity }: InitParams): State => {
    const initialWhere = own ? { createdBy: identity.id } : {};
    return {
        showingFileDetails: null,
        selected: [],
        hasPreviouslyUploadedFiles: null,
        queryParams: {
            scope,
            tags,
            types: accept,
            limit: 50,
            sort: ListFilesSort.CREATED_ON_DESC,
            where: { ...initialWhere, ...getWhere(scope) }
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
                limit: 40,
                sort: ListFilesSort.CREATED_ON_DESC
            };
            break;
        }
        case "showFileDetails": {
            next.showingFileDetails = action.src;
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
