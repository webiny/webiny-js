import gql from "graphql-tag";

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
    }
`;

const ERROR_FIELDS = /* GraphQL */ `
    {
        code
        message
        data
    }
`;

export const LIST_FILES = gql`
     query ListFiles($types: [String], $tags: [String], $limit: Int, $search: String, $after: String, $before: String) {
        files {
            listFiles(types: $types, limit: $limit, search: $search, tags: $tags, after: $after, before: $before) {
                data ${FILE_FIELDS}
                meta {
                    cursors {
                        next
                        previous
                    }
                    hasNextPage
                    hasPreviousPage
                    totalCount
                }
            }
        }
    }
`;

export const LIST_TAGS = gql`
    query ListTags {
        files {
            listTags
        }
    }
`;

export const CREATE_FILE = gql`
    mutation CreateFile($data: FileInput!) {
        files {
            createFile(data: $data) {
                error ${ERROR_FIELDS}
                data ${FILE_FIELDS}
            }
        }
    }
`;

export const UPDATE_FILE = gql`
    mutation UpdateFile($id: ID!, $data: FileInput!) {
        files {
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

export const DELETE_FILE = gql`
    mutation deleteFile($id: ID!) {
        files {
            deleteFile(id: $id) {
                data
                error ${ERROR_FIELDS}
            }
        }
    }
`;

export const GET_FILE_SETTINGS = gql`
    query getSettings {
        files {
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
