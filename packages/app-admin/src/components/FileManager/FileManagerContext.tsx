import React from "react";

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

function init({ accept, tags, scope }) {
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
            where: getWhere(scope)
        }
    };
}

function fileManagerReducer(state, action) {
    const next = { ...state };
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
}

const FileManagerContext = React.createContext({});

function FileManagerProvider({ children, ...props }) {
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
}

function useFileManager() {
    const context: any = React.useContext(FileManagerContext);
    if (!context) {
        throw new Error("useFileManager must be used within a FileManagerProvider");
    }

    const { state, dispatch } = context;
    return {
        selected: state.selected,
        toggleSelected(file) {
            dispatch({
                type: "toggleSelected",
                file
            });
        },
        hasPreviouslyUploadedFiles: state.hasPreviouslyUploadedFiles,
        setHasPreviouslyUploadedFiles(hasPreviouslyUploadedFiles) {
            dispatch({ type: "hasPreviouslyUploadedFiles", hasPreviouslyUploadedFiles });
        },
        queryParams: state.queryParams,
        setQueryParams(queryParams) {
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
        showFileDetails(src) {
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
