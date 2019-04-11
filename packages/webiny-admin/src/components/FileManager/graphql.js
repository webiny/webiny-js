import gql from "graphql-tag";

export const listFiles = gql`
    query ListFiles($types: [String], $sort: JSON, $page: Int, $perPage: Int, $search: String) {
        files {
            listFiles(types: $types, sort: $sort, page: $page, perPage: $perPage, search: $search) {
                data {
                    tags
                    src
                    size
                    name
                    type
                }
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
            }
        }
    }
`;
