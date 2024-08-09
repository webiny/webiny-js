import gql from "graphql-tag";
import { FileItem } from "@webiny/app-admin/types";
import { Settings } from "~/types";
import { ListTagsResponseItem } from "~/modules/FileManagerApiProvider/FileManagerApiContext/FileManagerApiContext";

export interface FmError {
    code: string;
    message: string;
    data?: Record<string, any> | null;
}

const ERROR_FIELDS = /* GraphQL */ `
    {
        code
        message
        data
    }
`;

export interface GetFileManagerSettingsQueryResponse {
    fileManager: {
        getSettings: {
            data: Settings;
            error?: FmError | null;
        };
    };
}

export interface ListFilesListFilesResponse {
    data: FileItem[];
    error: FmError | null;
    meta: {
        hasMoreItems: boolean;
        totalCount: number;
        cursor: string | null;
    };
}

export interface ListFilesQueryResponse {
    fileManager: {
        listFiles: ListFilesListFilesResponse;
    };
}

export type ListFilesWhereLocation = { folderId: string } | { folderId_in: string[] };

export type ListFilesSort = ListFilesSortItem[];
export type ListFilesSortItem = `${string}_ASC` | `${string}_DESC`;

export interface ListFilesWhereQueryVariables {
    location?: ListFilesWhereLocation;
    tags?: string;
    tags_in?: string[];
    tags_startsWith?: string;
    tags_not_startsWith?: string;
    createdBy?: string;
    AND?: ListFilesWhereQueryVariables[];
    [key: string]: any;
}

export interface ListFilesQueryVariables {
    limit?: number;
    after?: string | null;
    sort?: ListFilesSort;
    search?: string;
    where?: ListFilesWhereQueryVariables;
}

export const LIST_FILES = (FILE_FIELDS: string) => gql`
    query ListFiles(
        $search: String,
        $limit: Int,
        $after: String,
        $sort: [FmFileListSorter!],
        $where: FmFileListWhereInput
    ) {
        fileManager {
            listFiles(
                search: $search,
                limit: $limit,
                after: $after,
                where: $where,
                sort: $sort
            ) {
                data ${FILE_FIELDS}
                meta {
                    cursor
                    totalCount
                    hasMoreItems
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

export const GET_FILE = (FILE_FIELDS: string) => gql`
    query GetFile($id: ID!) {
        fileManager {
            getFile(id: $id) {
                data ${FILE_FIELDS}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export interface ListFileTagsQueryResponse {
    fileManager: {
        listTags: {
            data: ListTagsResponseItem[];
            error: FmError | null;
        };
    };
}

interface ListFileTagsWhereQueryVariables {
    tags_in?: string[];
    tags_startsWith?: string;
    tags_not_startsWith?: string;
    AND?: ListFileTagsWhereQueryVariables[];
    OR?: ListFileTagsWhereQueryVariables[];
}

export interface ListFileTagsQueryVariables {
    where?: ListFileTagsWhereQueryVariables;
}

export const LIST_TAGS = gql`
    query ListTags($where: FmTagsListWhereInput) {
        fileManager {
            listTags(where: $where) {
                data {
                    tag
                    count
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export interface CreateFileMutationResponse {
    fileManager: {
        createFile: {
            data: FileItem;
            error?: FmError | null;
        };
    };
}

export interface FileInput {
    key: string;
    name: string;
    size: number;
    type: string;
    tags: string[];
    aliases?: string[];
    meta?: Record<string, any>;
}

export interface CreateFileMutationVariables {
    data: FileInput;
    meta?: Record<string, any>;
}

export const CREATE_FILE = (FILE_FIELDS: string) => gql`
    mutation CreateFile($data: FmFileCreateInput!) {
        fileManager {
            createFile(data: $data) {
                error ${ERROR_FIELDS}
                data ${FILE_FIELDS}
            }
        }
    }
`;

export interface UpdateFileMutationResponse {
    fileManager: {
        updateFile: {
            data: FileItem;
            error?: FmError | null;
        };
    };
}

export interface UpdateFileMutationVariables {
    id: string;
    data: Partial<FileInput>;
}

export const UPDATE_FILE = (FILE_FIELDS: string) => gql`
    mutation UpdateFile($id: ID!, $data: FmFileUpdateInput!) {
        fileManager {
            updateFile(id: $id, data: $data) {
                data ${FILE_FIELDS}
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export interface DeleteFileMutationResponse {
    fileManager: {
        updateFile: {
            data: boolean;
            error?: FmError | null;
        };
    };
}

export interface DeleteFileMutationVariables {
    id: string;
}

export const DELETE_FILE = gql`
    mutation DeleteFile($id: ID!) {
        fileManager {
            deleteFile(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const GET_FILE_SETTINGS = gql`
    query GetSettings {
        fileManager {
            getSettings {
                data {
                    srcPrefix
                    uploadMinFileSize
                    uploadMaxFileSize
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const GET_FILE_MODEL = gql`
    query GetFileModel {
        fileManager {
            getFileModel {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;
