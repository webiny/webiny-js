const DATA_FIELD = /* GraphQL */ `
    {
        id
        name
        description
        slug
        permissions
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
    mutation CreateGroup($data: SecurityGroupInput!) {
        security {
            createGroup(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_SECURITY_GROUP = /* GraphQL */ `
    mutation UpdateGroup($id: ID!, $data: SecurityGroupInput!) {
        security {
            updateGroup(id: $id, data: $data) {
                data ${DATA_FIELD}
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
    query ListGroups($where: ListSecurityGroupWhereInput, $sort: Int) {
        security {
            listGroups(where: $where, sort: $sort) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_SECURITY_GROUP = /* GraphQL */ `
    query GetGroup($id: ID, $slug: String) {
        security {
            getGroup(id: $id, slug: $slug) {
               data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
