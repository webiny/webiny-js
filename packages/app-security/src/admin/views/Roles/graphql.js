// @flow
import gql from "graphql-tag";

const fields = `
    id
    name
    slug
    description
    scopes
`;

export const LIST_SCOPES = gql`
    query loadScopes {
        security {
            scopes
        }
    }
`;

export const LIST_ROLES = gql`
    query listRoles(
        $where: JSON
        $sort: JSON
        $page: Int
        $perPage: Int
        $search: SecurityRoleSearchInput
    ) {
        security {
            roles: listRoles(
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
