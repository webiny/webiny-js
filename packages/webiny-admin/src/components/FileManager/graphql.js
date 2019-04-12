import gql from "graphql-tag";

const fileFields = /* GraphQL */ `
    {
        __typename
        name
        src
        size
        type
        tags
    }
`;

export const listFiles = gql`
    query ListFiles($types: [String], $sort: JSON, $page: Int, $perPage: Int, $search: String) {
        files {
            listFiles(types: $types, sort: $sort, page: $page, perPage: $perPage, search: $search) {
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
