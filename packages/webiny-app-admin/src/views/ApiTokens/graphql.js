import gql from "graphql-tag";

const fields = `
    id token name description groups { id name } roles { id name }
`;

export const loadApiTokens = gql`
    query LoadApiTokens($where: JSON, $sort: JSON, $page: Int, $perPage: Int, $search: SearchInput) {
        security {
            tokens: listApiTokens(
                where: $where
                sort: $sort
                page: $page
                perPage: $perPage
                search: $search
            ) {
                data {
                    id
                    name
                    description
                    createdOn
                }
                meta {
                    count
                    totalCount
                    totalPages
                    to
                    from
                    nextPage
                    previousPage
                }
            }
        }
    }
`;

export const loadApiToken = gql`
    query LoadApiToken($id: ID!) {
        security {
            token: getApiToken(id: $id){
                data {
                    ${fields}
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const createApiToken = gql`
    mutation CreateApiToken($data: ApiTokenInput!){
        security {
            token: createApiToken(data: $data) {
                data {
                    ${fields}
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

export const updateApiToken = gql`
    mutation UpdateApiToken($id: ID!, $data: ApiTokenInput!){
        security {
            token: updateApiToken(id: $id, data: $data) {
                data {
                    ${fields}
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

export const deleteApiToken = gql`
    mutation DeleteApiToken($id: ID!) {
        security {
            deleteApiToken(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;
