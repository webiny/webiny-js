import React from "react";

function init({ accept }) {
    return {
        showingFileDetails: null,
        selected: [],
        hasPreviouslyUploadedFiles: null,
        queryParams: {
            types: accept,
            perPage: 50,
            sort: { createdOn: -1 }
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
                perPage: 40,
                sort: { createdOn: -1 }
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

const FileManagerContext = React.createContext();

function FileManagerProvider(props) {
    const [state, dispatch] = React.useReducer(fileManagerReducer, props, init);

    const value = React.useMemo(() => {
        return {
            state,
            dispatch
        };
    }, [state]);

    return <FileManagerContext.Provider value={value} {...props} />;
}

function useFileManager() {
    const context = React.useContext(FileManagerContext);
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
