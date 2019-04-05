import gql from "graphql-tag";

export const listFiles = gql`
    query ListFiles($where: JSON, $sort: JSON, $page: Int, $perPage: Int, $search: String) {
        files {
            listFiles(where: $where, sort: $sort, page: $page, perPage: $perPage, search: $search) {
                data {
                    id
                    src
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
