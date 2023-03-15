import React, { useCallback, useMemo } from "react";
import { MutationUpdaterFn } from "apollo-client";
import { useApolloClient } from "@apollo/react-hooks";
import { useSecurity } from "@webiny/app-security";
import {
    CREATE_FILE,
    CreateFileMutationResponse,
    DELETE_FILE,
    DeleteFileMutationResponse,
    UPDATE_FILE,
    UpdateFileMutationResponse
} from "~/components/FileManager/graphql";
import { Action, initializeState, State, StateQueryParams, stateReducer } from "./stateReducer";
import { updateCacheAfterFileCreate } from "./updateCacheAfterFileCreate";
import { updateCacheAfterFileDelete } from "./updateCacheAfterFileDelete";
import { updateCacheAfterFileUpdate } from "./updateCacheAfterFileUpdate";
import { getFileUploader } from "~/components/FileManager/getFileUploader";
import { FileManagerSecurityPermission, FileItem } from "../types";

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

interface FileManagerContext {
    state: State;
    dispatch: React.Dispatch<Action>;
    canRead: boolean;
    canCreate: boolean;
    canEdit: (file: FileItem) => boolean;
    canDelete: (file: FileItem) => boolean;
    createFile: (data: FileItem, options?: CreateFileOptions) => Promise<FileItem | undefined>;
    updateFile: (id: string, data: Partial<FileItem>, options?: UpdateFileOptions) => Promise<void>;
    deleteFile: (id: string, options?: DeleteFileOptions) => Promise<void>;
    uploadFile: (file: File) => Promise<FileItem | undefined>;
}

const FileManagerContext = React.createContext<FileManagerContext | undefined>(undefined);

export interface FileManagerProviderProps {
    accept: string[];
    tags: string[];
    scope?: string;
    own?: boolean;
}

interface CreateFileOptions {
    updateCache?: MutationUpdaterFn<CreateFileMutationResponse>;
}

interface UpdateFileOptions {
    updateCache?: MutationUpdaterFn<UpdateFileMutationResponse>;
}

interface DeleteFileOptions {
    updateCache?: MutationUpdaterFn<DeleteFileMutationResponse>;
}

const FileManagerProvider: React.FC<FileManagerProviderProps> = ({ children, ...props }) => {
    const { identity, getPermission } = useSecurity();
    const client = useApolloClient();

    const fmFilePermission = useMemo<FileManagerSecurityPermission | null>(() => {
        return getPermission<FileManagerSecurityPermission>("fm.file");
    }, [identity]);

    const [state, dispatch] = React.useReducer(
        stateReducer,
        { ...props, identity },
        initializeState
    );

    const canDelete = useCallback(
        (item: FileItem) => {
            // Bail out early if no access
            if (!fmFilePermission) {
                return false;
            }

            if (fmFilePermission.own) {
                const identityId = identity ? identity.id || identity.login : null;
                if (!identityId) {
                    return false;
                }
                return item.createdBy.id === identityId;
            }

            if (typeof fmFilePermission.rwd === "string") {
                return fmFilePermission.rwd.includes("d");
            }
            return true;
        },
        [fmFilePermission]
    );

    const canRead = useMemo(() => {
        return Boolean(fmFilePermission);
    }, [fmFilePermission]);

    const canCreate = useMemo(() => {
        // Bail out early if no access
        if (!fmFilePermission) {
            return false;
        }

        if (fmFilePermission.own) {
            return true;
        }

        if (typeof fmFilePermission.rwd === "string") {
            return fmFilePermission.rwd.includes("w");
        }

        return true;
    }, [fmFilePermission]);

    const canEdit = useCallback(
        (item: FileItem) => {
            // Bail out early if no access
            if (!fmFilePermission) {
                return false;
            }
            const creatorId = item.createdBy.id;

            if (fmFilePermission.own && creatorId) {
                const identityId = identity ? identity.id || identity.login : null;
                return creatorId === identityId;
            }

            if (typeof fmFilePermission.rwd === "string") {
                return fmFilePermission.rwd.includes("w");
            }

            return true;
        },
        [fmFilePermission]
    );

    const createFile = async (data: FileItem, options: CreateFileOptions = {}) => {
        const response = await client.mutate<CreateFileMutationResponse>({
            mutation: CREATE_FILE,
            variables: {
                data
            },
            update(cache, result) {
                updateCacheAfterFileCreate(state.queryParams)(cache, result);
                if (options.updateCache) {
                    options.updateCache(cache, result);
                }
            }
        });

        return response.data?.fileManager.createFile.data;
    };

    const updateFile = async (
        id: string,
        data: Partial<FileItem>,
        options: UpdateFileOptions = {}
    ) => {
        await client.mutate({
            mutation: UPDATE_FILE,
            variables: {
                id,
                data
            },
            update(cache, result) {
                updateCacheAfterFileUpdate(id, state.queryParams, data)(cache, result);
                if (options.updateCache) {
                    options.updateCache(cache, result);
                }
            }
        });
    };

    const deleteFile = async (id: string, options: DeleteFileOptions = {}) => {
        await client.mutate({
            mutation: DELETE_FILE,
            variables: {
                id
            },
            update(cache, result) {
                updateCacheAfterFileDelete(id, state.queryParams)(cache, result);
                if (options.updateCache) {
                    options.updateCache(cache, result);
                }
            }
        });
    };

    /**
     * Upload native browser File
     * @see https://developer.mozilla.org/en-US/docs/Web/API/File
     * @param File file
     */
    const uploadFile = async (file: File) => {
        const response = await getFileUploader()(file, { apolloClient: client });

        return await createFile({
            ...response,
            tags: state.queryParams.scope ? [state.queryParams.scope] : []
        });
    };

    const value: FileManagerContext = {
        state,
        dispatch,
        canRead,
        canCreate,
        canEdit,
        canDelete,
        createFile,
        updateFile,
        deleteFile,
        uploadFile
    };

    return <FileManagerContext.Provider value={value}>{children}</FileManagerContext.Provider>;
};

function useFileManager() {
    const context = React.useContext(FileManagerContext);
    if (!context) {
        throw new Error("useFileManager must be used within a FileManagerProvider");
    }

    const { state, dispatch, ...rest } = context;
    return {
        ...rest,
        selected: state.selected,
        toggleSelected(file: FileItem) {
            dispatch({
                type: "toggleSelected",
                file
            });
        },
        hasPreviouslyUploadedFiles: state.hasPreviouslyUploadedFiles,
        setHasPreviouslyUploadedFiles(state: boolean) {
            dispatch({ type: "hasPreviouslyUploadedFiles", state });
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
        showingFileDetails: state.showingFileDetails
    };
}

export { FileManagerProvider, useFileManager };
