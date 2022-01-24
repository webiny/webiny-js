import React from "react";
import { FileItem } from "./types";

enum ListFilesSort {
    CREATED_ON_ASC,
    CREATED_ON_DESC,
    SIZE_ASC,
    SIZE_DESC
}

interface InitParams {
    accept: string[];
}
interface StateQueryParams {
    types: string[];
    limit: number;
    sort: number;
}
interface State {
    showingFileDetails: string;
    selected: FileItem[];
    hasPreviouslyUploadedFiles: boolean;
    queryParams: StateQueryParams;
    dragging: boolean;
    uploading: boolean;
}
const init = ({ accept }: InitParams): State => {
    return {
        showingFileDetails: null,
        selected: [],
        hasPreviouslyUploadedFiles: null,
        queryParams: {
            types: accept,
            limit: 50,
            sort: ListFilesSort.CREATED_ON_DESC
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
    const [state, dispatch] = React.useReducer(fileManagerReducer, props, init);

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
