import { FileItem } from "@webiny/app-admin/types";
import gql from "graphql-tag";
import { Settings } from "~/types";

const FILE_FIELDS = /* GraphQL */ `
    {
        __typename
        id
        name
        key
        src
        size
        type
        tags
        aliases
        createdOn
        createdBy {
            id
        }
    }
`;

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
            error?: Error | null;
        };
    };
}

export interface ListFilesListFilesResponse {
    data: FileItem[];
    error?: Error | null;
    meta: {
        hasMoreItems: boolean;
        totalItem: number;
        cursor: string | null;
    };
}

export interface ListFilesQueryResponse {
    fileManager: {
        listFiles: ListFilesListFilesResponse;
    };
}

export interface ListFilesQueryVariables {
    limit?: number;
    after?: string | null;
    where?: {
        search?: string;
        type?: string;
        type_in?: string[];
        tag?: string;
        tag_in?: string[];
        tag_and_in?: string[];
        tag_startsWith?: string;
        tag_not_startsWith?: string;
        createdBy?: string;
    };
}

export const LIST_FILES = gql`
    query ListFiles(
        $limit: Int,
        $after: String,
        $where: FileWhereInput
    ) {
        fileManager {
            listFiles(
                limit: $limit,
                after: $after,
                where: $where
            ) {
                data ${FILE_FIELDS}
                meta {
                    cursor
                    totalCount
                }
            }
        }
    }
`;

export interface ListFileTagsQueryResponse {
    fileManager: {
        listTags: string[];
    };
}

export interface ListFileTagsQueryVariables {
    where?: {
        tag_startsWith?: String;
        tag_not_startsWith?: String;
    };
}

export const LIST_TAGS = gql`
    query ListTags($where: TagWhereInput) {
        fileManager {
            listTags(where: $where)
        }
    }
`;

export interface CreateFileMutationResponse {
    fileManager: {
        createFile: {
            data: FileItem;
            error?: Error | null;
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
}

export const CREATE_FILE = gql`
    mutation CreateFile($data: CreateFileInput!) {
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
            error?: Error | null;
        };
    };
}

export interface UpdateFileMutationVariables {
    id: string;
    data: Partial<FileInput>;
}

export const UPDATE_FILE = gql`
    mutation UpdateFile($id: ID!, $data: UpdateFileInput!) {
        fileManager {
            updateFile(id: $id, data: $data) {
                data {
                    id
                    src
                    name
                    tags
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export interface DeleteFileMutationResponse {
    fileManager: {
        updateFile: {
            data: boolean;
            error?: Error | null;
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
