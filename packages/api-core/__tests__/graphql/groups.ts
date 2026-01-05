const DATA_FIELD = (extra = "") => /* GraphQL */ `
    {
        name
        description
        slug
        permissions
        ${extra}
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_SECURITY_ROLE = /* GraphQL */ `
    mutation CreateGroup($data: SecurityRoleCreateInput!) {
        security {
            createRole(data: $data) {
                data ${DATA_FIELD("id")}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_SECURITY_ROLE = /* GraphQL */ `
    mutation UpdateRole($id: ID!, $data: SecurityRoleUpdateInput!) {
        security {
            updateRole(id: $id, data: $data) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_SECURITY_ROLE = /* GraphQL */ `
    mutation DeleteRole($id: ID!) {
        security {
            deleteRole(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_SECURITY_ROLES = /* GraphQL */ `
    query ListGroups {
        security {
            listGroups {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_SECURITY_ROLE = /* GraphQL */ `
    query GetGroup($id: ID!) {
        security {
            getGroup(where: { id: $id }) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;
