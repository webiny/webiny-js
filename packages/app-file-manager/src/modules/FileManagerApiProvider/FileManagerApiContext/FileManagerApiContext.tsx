import React, { useCallback, useMemo } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { useSecurity } from "@webiny/app-security";
import {
    CREATE_FILE,
    CreateFileMutationResponse,
    CreateFileMutationVariables,
    DELETE_FILE,
    DeleteFileMutationResponse,
    DeleteFileMutationVariables,
    GET_FILE_SETTINGS,
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
    FileInput
} from "../graphql";
import { FileItem, FileManagerSecurityPermission } from "@webiny/app-admin/types";
import { getFileUploader } from "./getFileUploader";
import { Settings } from "~/types";

export interface ListTagsResponseItem {
    tag: string;
    count: number;
}

export interface FileManagerApiContextData<TFileItem extends FileItem = FileItem> {
    canRead: boolean;
    canCreate: boolean;
    canEdit: (file: TFileItem) => boolean;
    canDelete: (file: TFileItem) => boolean;
    createFile: (data: TFileItem) => Promise<TFileItem | undefined>;
    updateFile: (id: string, data: Partial<TFileItem>) => Promise<void>;
    deleteFile: (id: string) => Promise<void>;
    uploadFile: (file: File, options?: UploadFileOptions) => Promise<TFileItem | undefined>;
    listFiles: (
        params?: ListFilesQueryVariables
    ) => Promise<{ files: TFileItem[]; meta: ListFilesListFilesResponse["meta"] }>;
    listTags: (params?: ListTagsOptions) => Promise<ListTagsResponseItem[]>;

    getSettings(): Promise<Settings>;
}

export const FileManagerApiContext = React.createContext<FileManagerApiContextData | undefined>(
    undefined
);

export interface FileManagerApiProviderProps {
    children: React.ReactNode;
}

interface UploadFileOptions {
    tags?: string[];
    onProgress?: (params: { sent: number; total: number; percentage: number }) => void;
}

interface ListTagsOptions {
    where?: ListFileTagsQueryVariables["where"];
}

const FM_FULL_ACCESS_PERMISSION_NAME = "fm.*";

const FileManagerApiProvider = ({ children }: FileManagerApiProviderProps) => {
    const { identity, getIdentityId, getPermissions, getPermission } = useSecurity();
    const client = useApolloClient();

    // Note for below permissions checks:
    // `own: true` defines full RWD access to files created by the user.

    const fmFilePermissions = useMemo<FileManagerSecurityPermission[]>(() => {
        return getPermissions<FileManagerSecurityPermission>("fm.file");
    }, [identity]);

    const hasFullAccess = useMemo(
        () => !!getPermission(FM_FULL_ACCESS_PERMISSION_NAME),
        [identity]
    );

    const hasNoAccess = useMemo(() => fmFilePermissions.length === 0, [fmFilePermissions]);

    const canDelete = useCallback(
        (item: FileItem) => {
            // Bail out early if no access or has full access.
            if (hasNoAccess) {
                return false;
            }

            return (
                hasFullAccess ||
                fmFilePermissions.some(({ rwd, own }) => {
                    if (own) {
                        const identityId = getIdentityId();
                        const createdById = item.createdBy?.id;
                        return identityId && identityId === createdById;
                    }

                    if (rwd && rwd.includes("d")) {
                        return true;
                    }

                    return false;
                })
            );
        },
        [fmFilePermissions]
    );

    const canRead = useMemo(() => {
        // Bail out early if no access or has full access.
        if (hasNoAccess) {
            return false;
        }

        return hasFullAccess || fmFilePermissions.length > 0;
    }, [fmFilePermissions]);

    const canCreate = useMemo(() => {
        // Bail out early if no access or has full access.
        if (hasNoAccess) {
            return false;
        }

        return hasFullAccess || fmFilePermissions.some(({ rwd }) => rwd && rwd.includes("w"));
    }, [fmFilePermissions]);

    const canEdit = useCallback(
        (item: FileItem) => {
            // Bail out early if no access or has full access.
            if (hasNoAccess) {
                return false;
            }

            return (
                hasFullAccess ||
                fmFilePermissions.some(({ rwd, own }) => {
                    if (own) {
                        const identityId = getIdentityId();
                        const createdById = item.createdBy?.id;
                        return identityId && identityId === createdById;
                    }

                    if (rwd && rwd.includes("w")) {
                        return true;
                    }

                    return false;
                })
            );
        },
        [fmFilePermissions]
    );

    const createFile = async (data: FileInput) => {
        const response = await client.mutate<
            CreateFileMutationResponse,
            CreateFileMutationVariables
        >({
            mutation: CREATE_FILE,
            variables: {
                data
            }
        });

        return response.data?.fileManager.createFile.data;
    };

    const updateFile = async (id: string, data: Partial<FileItem>) => {
        await client.mutate<UpdateFileMutationResponse, UpdateFileMutationVariables>({
            mutation: UPDATE_FILE,
            variables: {
                id,
                data
            }
        });
    };

    const deleteFile = async (id: string) => {
        await client.mutate<DeleteFileMutationResponse, DeleteFileMutationVariables>({
            mutation: DELETE_FILE,
            variables: {
                id
            }
        });
    };

    const listFiles: FileManagerApiContextData["listFiles"] = async (params = {}) => {
        const { data } = await client.query<ListFilesQueryResponse>({
            query: LIST_FILES,
            variables: params,
            fetchPolicy: "no-cache"
        });
        const { data: files, meta } = data.fileManager.listFiles;
        return { files, meta };
    };

    const listTags = async (params = {}) => {
        const { data } = await client.query<ListFileTagsQueryResponse>({
            query: LIST_TAGS,
            variables: params
        });

        return data.fileManager.listTags.data;
    };

    /**
     * Upload native browser File
     * @see https://developer.mozilla.org/en-US/docs/Web/API/File
     * @param File file
     */
    const uploadFile = async (file: File, options: UploadFileOptions = {}) => {
        const response = await getFileUploader().upload(file, {
            apolloClient: client,
            onProgress: options.onProgress
        });

        const tags = options?.tags || [];

        return await createFile({ ...response, tags });
    };

    const getSettings = async () => {
        const settingsQuery = await client.query<GetFileManagerSettingsQueryResponse>({
            query: GET_FILE_SETTINGS
        });
        return settingsQuery.data.fileManager.getSettings.data || {};
    };

    const value: FileManagerApiContextData = {
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
