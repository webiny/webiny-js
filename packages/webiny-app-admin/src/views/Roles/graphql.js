import gql from "graphql-tag";

const fields = `
    id
    name
    slug
    description
    scopes
`;

export const loadScopes = gql`
    query LoadScopes {
        security {
            scopes
        }
    }
`;

export const loadRoles = gql`
    query LoadRoles($where: JSON, $sort: JSON, $page: Int, $perPage: Int, $search: SearchInput) {
        security {
            roles: listRoles(where: $where, sort: $sort, page: $page, perPage: $perPage, search: $search) {
                data {
                    id
                    name
                    description
                    createdOn
                }
            }
        }
    }
`;

export const loadRole = gql`
    query LoadRole($id: ID!) {
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

export const createRole = gql`
    mutation CreateRole($data: RoleInput!){
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

export const updateRole = gql`
    mutation UpdateRole($id: ID!, $data: RoleInput!){
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

export const deleteRole = gql`
    mutation DeleteRole($id: ID!){
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

