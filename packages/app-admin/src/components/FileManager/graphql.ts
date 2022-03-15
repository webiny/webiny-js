import gql from "graphql-tag";
import { FileItem } from "~/components/FileManager/types";

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

/**
 * ##################
 * List Files Query Response
 */
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
    types?: string[];
    tags?: string[];
    limit?: number;
    search?: string;
    after?: string;
}
export const LIST_FILES = gql`
    query ListFiles(
        $types: [String],
        $tags: [String],
        $limit: Int,
        $search: String,
        $after: String,
        $where: FileWhereInput
    ) {
        fileManager {
            listFiles(
                types: $types,
                limit: $limit,
                search: $search,
                tags: $tags,
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
/**
 * ##################
 * List File Tags Query Response
 */
export interface ListFileTagsQueryResponse {
    fileManager: {
        listTags: string[];
        error: Error | null;
    };
}
export const LIST_TAGS = gql`
    query ListTags($where: TagWhereInput) {
        fileManager {
            listTags(where: $where)
        }
    }
`;
/**
 * ##################
 * Create File Mutation Response
 */
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
    tags: string;
    meta: Record<string, any>;
}
export interface CreateFileMutationVariables {
    data: FileInput;
}
export const CREATE_FILE = gql`
    mutation CreateFile($data: FileInput!) {
        fileManager {
            createFile(data: $data) {
                error ${ERROR_FIELDS}
                data ${FILE_FIELDS}
            }
        }
    }
`;
/**
 * ##################
 * Update File Mutation Response
 */
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
    mutation UpdateFile($id: ID!, $data: FileInput!) {
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

/**
 * ##################
 * Delete File Mutation Response
 */
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
    mutation deleteFile($id: ID!) {
        fileManager {
            deleteFile(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const GET_FILE_SETTINGS = gql`
    query getSettings {
        fileManager {
            getSettings {
                data {
                    uploadMinFileSize
                    uploadMaxFileSize
                }
                error ${ERROR_FIELDS}
            }
        }
    }
`;
