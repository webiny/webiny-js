import React from "react";
import { FileItem } from "./types";
import { useSecurity } from "@webiny/app-security";

enum ListFilesSort {
    CREATED_ON_ASC,
    CREATED_ON_DESC,
    SIZE_ASC,
    SIZE_DESC
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

interface InitParams {
    accept: string[];
    tags: string[];
    scope: string;
    own: boolean;
    identity: any;
}
interface StateQueryParams {
    types: string[];
    limit: number;
    sort: number;
    tags: string[];
    scope: string;
    where: Record<string, any>;
}
interface State {
    showingFileDetails: string | null;
    selected: FileItem[];
    hasPreviouslyUploadedFiles: boolean | null;
    queryParams: StateQueryParams;
    dragging: boolean;
    uploading: boolean;
}
const init = ({ accept, tags, scope, own, identity }: InitParams): State => {
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

interface Action {
    type:
        | "toggleSelected"
        | "queryParams"
        | "showFileDetails"
        | "dragging"
        | "hasPreviouslyUploadedFiles"
        | "uploading";
    file: FileItem;
    queryParams: StateQueryParams;
    src: string;
    state: boolean;
    hasPreviouslyUploadedFiles: boolean;
}
interface Reducer {
    (prev: State, action: Action): State;
}

const fileManagerReducer: Reducer = (state: State, action) => {
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
            next.hasPreviouslyUploadedFiles = action.hasPreviouslyUploadedFiles;
            break;
        }
        case "uploading": {
            next.uploading = action.state;
            break;
        }
    }

    return next;
};

const FileManagerContext = React.createContext({});

const FileManagerProvider: React.FC = ({ children, ...props }) => {
    const { identity } = useSecurity();
    /**
     * TODO @ts-refactor
     * Figure out how to type the rest of the types.
     */
    // @ts-ignore
    const [state, dispatch] = React.useReducer(fileManagerReducer, { ...props, identity }, init);

    const value = React.useMemo(() => {
        return {
            state,
            dispatch
        };
    }, [state]);

    return (
        <FileManagerContext.Provider value={value} {...props}>
            {children}
        </FileManagerContext.Provider>
    );
};

function useFileManager() {
    const context: any = React.useContext(FileManagerContext);
    if (!context) {
        throw new Error("useFileManager must be used within a FileManagerProvider");
    }

    const { state, dispatch } = context;
    return {
        selected: state.selected,
        toggleSelected(file: FileItem) {
            dispatch({
                type: "toggleSelected",
                file
            });
        },
        hasPreviouslyUploadedFiles: state.hasPreviouslyUploadedFiles,
        setHasPreviouslyUploadedFiles(hasPreviouslyUploadedFiles: boolean) {
            dispatch({ type: "hasPreviouslyUploadedFiles", hasPreviouslyUploadedFiles });
        },
        queryParams: state.queryParams,
        setQueryParams(queryParams: StateQueryParams) {
            dispatch({ type: "queryParams", queryParams });
        },
        setDragging(state = true) {
            dispatch({
                type: "dragging",
                state
            });
        },
        dragging: state.dragging,
        setUploading(state = true) {
            dispatch({
                type: "uploading",
                state
            });
        },
        uploading: state.uploading,
        showFileDetails(src: string) {
            dispatch({ type: "showFileDetails", src });
        },
        hideFileDetails() {
            dispatch({ type: "showFileDetails", src: null });
        },
        showingFileDetails: state.showingFileDetails,
        state,
        dispatch
    };
}

export { FileManagerProvider, useFileManager };
