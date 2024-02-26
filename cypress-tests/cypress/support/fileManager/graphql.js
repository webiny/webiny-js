import { gql } from "graphql-request";

const BASE_FIELDS = `
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
`;

const ERROR_FIELDS = `
    code
    message
    data
`;

export const LIST_FILES = gql`
     query ListFiles($types: [String], $tags: [String], $limit: Int, $search: String, $after: String) {
        fileManager {
            files: listFiles(types: $types, limit: $limit, search: $search, tags: $tags, after: $after) {
                data {
                    ${BASE_FIELDS}
                }
                meta {
                    cursor
                    totalCount
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const DELETE_FILE = gql`
    mutation deleteFile($id: ID!) {
        fileManager {
            deleteFile(id: $id) {
                data
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

export const LIST_TAGS = gql`
    query ListTags {
        fileManager {
            listTags
        }
    }
`;
