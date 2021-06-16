export const CREATE_API_KEY = /* GraphQL */ `
    mutation CreateApiKey($data: SecurityApiKeyInput!) {
        security {
            createApiKey(data: $data) {
                data {
                    id
                    name
                    description
                    token
                    permissions
                    createdOn
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

export const LIST_API_KEYS = /* GraphQL */ `
    query ListApiKeys {
        security {
            listApiKeys {
                data {
                    id
                    name
                    description
                    token
                    permissions
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

export const GET_API_KEY = /* GraphQL */ `
    query GetApiKey($id: ID!) {
        security {
            getApiKey(id: $id) {
                data {
                    id
                    name
                    description
                    token
                    permissions
                }
            }
        }
    }
`;

export const UPDATE_API_KEY = /* GraphQL */ `
    mutation UpdateApiKey($id: ID!, $data: SecurityApiKeyInput!) {
        security {
            updateApiKey(id: $id, data: $data) {
                data {
                    id
                    name
                    description
                    token
                    permissions
                }
            }
        }
    }
`;

export const DELETE_API_KEY = /* GraphQL */ `
    mutation DeleteApiKey($id: ID!) {
        security {
            deleteApiKey(id: $id) {
                data
            }
        }
    }
`;
