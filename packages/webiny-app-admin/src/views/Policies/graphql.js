import gql from "graphql-tag";

const fields = `
    id
    name
    slug
    description
    scopes
`;

export const loadRoles = gql`
    query LoadRoles($where: JSON, $sort: JSON, $page: Int, $perPage: Int, $search: SearchInput) {
        security {
            listRoles(where: $where, sort: $sort, page: $page, perPage: $perPage, search: $search) {
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
            getRole(id: $id){
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
    mutation CreateRole($data: JSON!){
        security {
            role: createRole(data: $data) {
                ${fields}
            }
        }
    }
`;

export const updateRole = gql`
    mutation UpdateRole($id: ID!, $data: JSON!){
        security {
            role: updateRole(id: $id, data: $data) {
                ${fields}
            }
        }
    }
`;
