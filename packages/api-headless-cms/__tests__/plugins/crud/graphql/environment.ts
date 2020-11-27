const DATA_FIELD = /* GraphQL*/ `
    {
        id
        name
        slug
        description
        createdFrom {
            id
        }
    }
`;
const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const CREATE_ENVIRONMENT_QUERY = /* GraphQL */ `
    mutation CreateEnvironment($data: CmsEnvironmentInput!) {
        cms {
            createEnvironment(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const GET_ENVIRONMENT_QUERY = /* GraphQL */ `
    query GetEnvironment($id: ID!) {
        cms {
            getEnvironment(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const UPDATE_ENVIRONMENT_QUERY = /* GraphQL */ `
    mutation UpdateEnvironment($id: ID!, $data: CmsEnvironmentInput!) {
        cms {
            updateEnvironment(id: $id, data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const DELETE_ENVIRONMENT_QUERY = /* GraphQL */ `
    mutation DeleteEnvironment($id: ID!) {
        cms {
            updateEnvironment(id: $id) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const LIST_ENVIRONMENT_QUERY = /* GraphQL */ `
    query ListEnvironment() {
        cms {
            listEnvironment {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
