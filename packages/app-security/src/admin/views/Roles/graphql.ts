import gql from "graphql-tag";

const fields = `
    id
    name
    slug
    description
    scopes
`;

export const LIST_ROLES = gql`
    query listRoles(
        $where: JSON
        $sort: JSON
        $search: SecurityRoleSearchInput
        $limit: Int
        $after: String
        $before: String
    ) {
        security {
            roles: listRoles(
                where: $where
                sort: $sort
                search: $search
                limit: $limit
                after: $after
                before: $before
            ) {
                data {
                    id
                    name
                    description
                    createdOn
                }
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

export const GET_ROLE = gql`
    query getRole($id: ID!) {
        security {
            role: getRole(id: $id){
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

export const CREATE_ROLE = gql`
    mutation createRole($data: SecurityRoleInput!){
        security {
            role: createRole(data: $data) {
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

export const UPDATE_ROLE = gql`
    mutation updateRole($id: ID!, $data: SecurityRoleInput!){
        security {
            role: updateRole(id: $id, data: $data) {
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

export const DELETE_ROLE = gql`
    mutation deleteRole($id: ID!) {
        security {
            deleteRole(id: $id) {
                data
                error {
                    code
                    message
                }
            }
        }
    }
`;
