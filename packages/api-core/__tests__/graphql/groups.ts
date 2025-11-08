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

export const CREATE_SECURITY_GROUP = /* GraphQL */ `
    mutation CreateGroup($data: SecurityGroupCreateInput!) {
        security {
            createGroup(data: $data) {
                data ${DATA_FIELD("id")}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_SECURITY_GROUP = /* GraphQL */ `
    mutation UpdateGroup($id: ID!, $data: SecurityGroupUpdateInput!) {
        security {
            updateGroup(id: $id, data: $data) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_SECURITY_GROUP = /* GraphQL */ `
    mutation DeleteGroup($id: ID!) {
        security {
            deleteGroup(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const LIST_SECURITY_GROUPS = /* GraphQL */ `
    query ListGroups {
        security {
            listGroups {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_SECURITY_GROUP = /* GraphQL */ `
    query GetGroup($id: ID!) {
        security {
            getGroup(where: { id: $id }) {
                data ${DATA_FIELD()}
                error ${ERROR_FIELD}
            }
        }
    }
`;
