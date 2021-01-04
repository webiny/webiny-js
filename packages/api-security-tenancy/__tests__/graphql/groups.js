const DATA_FIELD = /* GraphQL */ `
    {
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
    mutation CreateGroup($data: SecurityGroupCreateInput!) {
        security {
            createGroup(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_SECURITY_GROUP = /* GraphQL */ `
    mutation UpdateGroup($slug: String!, $data: SecurityGroupUpdateInput!) {
        security {
            updateGroup(slug: $slug, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const DELETE_SECURITY_GROUP = /* GraphQL */ `
    mutation DeleteGroup($slug: String!) {
        security {
            deleteGroup(slug: $slug) {
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
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_SECURITY_GROUP = /* GraphQL */ `
    query GetGroup($slug: String) {
        security {
            getGroup(slug: $slug) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
