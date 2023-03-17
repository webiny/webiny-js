import React, { useCallback, useMemo } from "react";
import { MutationUpdaterFn } from "apollo-client";
import { useApolloClient } from "@apollo/react-hooks";
import { useSecurity } from "@webiny/app-security";
import {
    CREATE_FILE,
    CreateFileMutationResponse,
    CreateFileMutationVariables,
    DELETE_FILE,
    DeleteFileMutationResponse,
    DeleteFileMutationVariables,
    GetFileManagerSettingsQueryResponse,
    LIST_FILES,
    LIST_TAGS,
    ListFilesListFilesResponse,
    ListFilesQueryResponse,
    ListFilesQueryVariables,
    ListFileTagsQueryResponse,
    ListFileTagsQueryVariables,
    UPDATE_FILE,
    UpdateFileMutationResponse,
    UpdateFileMutationVariables,
    GET_FILE_SETTINGS
} from "../graphql";
import { FileItem, FileManagerSecurityPermission } from "@webiny/app-admin/types";
import { getFileUploader } from "./getFileUploader";
import { Settings } from "~/types";

export interface FileManagerApiContext {
    canRead: boolean;
    canCreate: boolean;
    canEdit: (file: FileItem) => boolean;
    canDelete: (file: FileItem) => boolean;
    createFile: (data: FileItem, options?: CreateFileOptions) => Promise<FileItem | undefined>;
    updateFile: (id: string, data: Partial<FileItem>, options?: UpdateFileOptions) => Promise<void>;
    deleteFile: (id: string, options?: DeleteFileOptions) => Promise<void>;
    uploadFile: (file: File, options?: UploadFileOptions) => Promise<FileItem | undefined>;
    listFiles: (
        params?: ListFilesQueryVariables
    ) => Promise<{ files: FileItem[]; meta: ListFilesListFilesResponse["meta"] }>;
    listTags: (params?: ListTagsOptions) => Promise<string[]>;
    getSettings(): Promise<Settings>;
}

export const FileManagerApiContext = React.createContext<FileManagerApiContext | undefined>(
    undefined
);

export interface FileManagerApiProviderProps {
    children: React.ReactNode;
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

interface UploadFileOptions {
    tags?: string[];
}

interface ListTagsOptions {
    where?: ListFileTagsQueryVariables["where"];
}

const FileManagerApiProvider = ({ children }: FileManagerApiProviderProps) => {
    const { identity, getPermission } = useSecurity();
    const client = useApolloClient();

    const fmFilePermission = useMemo<FileManagerSecurityPermission | null>(() => {
        return getPermission<FileManagerSecurityPermission>("fm.file");
    }, [identity]);

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
        const response = await client.mutate<
            CreateFileMutationResponse,
            CreateFileMutationVariables
        >({
            mutation: CREATE_FILE,
            variables: {
                data
            },
            update(cache, result) {
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
        await client.mutate<UpdateFileMutationResponse, UpdateFileMutationVariables>({
            mutation: UPDATE_FILE,
            variables: {
                id,
                data
            },
            update(cache, result) {
                if (options.updateCache) {
                    options.updateCache(cache, result);
                }
            }
        });
    };

    const deleteFile = async (id: string, options: DeleteFileOptions = {}) => {
        await client.mutate<DeleteFileMutationResponse, DeleteFileMutationVariables>({
            mutation: DELETE_FILE,
            variables: {
                id
            },
            update(cache, result) {
                if (options.updateCache) {
                    options.updateCache(cache, result);
                }
            }
        });
    };

    const listFiles: FileManagerApiContext["listFiles"] = async (params = {}) => {
        const { data } = await client.query<ListFilesQueryResponse>({
            query: LIST_FILES,
            variables: params,
            fetchPolicy: "no-cache"
        });
        const { data: files, meta } = data.fileManager.listFiles;
        return { files, meta };
    };

    const listTags: FileManagerApiContext["listTags"] = async (params = {}) => {
        const { data } = await client.query<ListFileTagsQueryResponse>({
            query: LIST_TAGS,
            variables: params
        });

        return data.fileManager.listTags;
    };

    /**
     * Upload native browser File
     * @see https://developer.mozilla.org/en-US/docs/Web/API/File
     * @param File file
     */
    const uploadFile = async (file: File, options: UploadFileOptions = {}) => {
        const response = await getFileUploader()(file, { apolloClient: client });

        const tags = options?.tags || [];

        return await createFile({ ...response, tags });
    };

    const getSettings = async () => {
        const settingsQuery = await client.query<GetFileManagerSettingsQueryResponse>({
            query: GET_FILE_SETTINGS
        });
        return settingsQuery.data.fileManager.getSettings.data || {};
    };

    const value: FileManagerApiContext = {
        canRead,
        canCreate,
        canEdit,
        canDelete,
        createFile,
        updateFile,
        deleteFile,
        uploadFile,
        listFiles,
        listTags,
        getSettings
    };

    return (
        <FileManagerApiContext.Provider value={value}>{children}</FileManagerApiContext.Provider>
    );
};

export { FileManagerApiProvider };
