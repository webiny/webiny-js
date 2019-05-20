import gql from "graphql-tag";

const fileFields = /* GraphQL */ `
    {
        __typename
        name
        src
        size
        type
        tags
        createdOn
    }
`;

export const listFiles = gql`
     query ListFiles($types: [String], $tags: [String], $sort: JSON, $page: Int, $perPage: Int, $search: String) {
        files {
            listFiles(types: $types, sort: $sort, page: $page, perPage: $perPage, search: $search, tags: $tags) {
                data ${fileFields}
                meta {
                    totalCount
                    to
                    from
                    nextPage
                    previousPage
                }
            }
        }
    }
`;

export const listTags = gql`
    query ListTags {
        files {
            listTags
        }
    }
`;

export const createFile = gql`
    mutation CreateFile($data: FileInput!) {
        files {
            createFile(data: $data) {
                error {
                    message
                }
                data ${fileFields}
            }
        }
    }
`;

export const updateFileBySrc = gql`
    mutation UpdateFile($src: String!, $data: FileInput!) {
        files {
            updateFileBySrc(src: $src, data: $data) {
                data {
                    src
                    name
                    tags
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;
