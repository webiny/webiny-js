export const CREATE_ACCESS_TOKEN = /* GraphQL */ `
    mutation CreateAccessToken($data: SecurityAccessTokenInput!) {
        security {
            createAccessToken(data: $data) {
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
                    data
                }
            }
        }
    }
`;

export const LIST_ACCESS_TOKENS = /* GraphQL */ `
    query ListAccessTokens {
        security {
            listAccessTokens {
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

export const GET_ACCESS_TOKEN = /* GraphQL */ `
    query GetAccessToken($id: ID!) {
        security {
            getAccessToken(id: $id) {
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

export const UPDATE_ACCESS_TOKEN = /* GraphQL */ `
    mutation UpdateAccessToken($id: ID!, $data: SecurityAccessTokenInput!) {
        security {
            updateAccessToken(id: $id, data: $data) {
                data {
                    name
                    description
                    permissions
                }
            }
        }
    }
`;

export const DELETE_ACCESS_TOKEN = /* GraphQL */ `
    mutation DeleteAccessToken($id: ID!) {
        security {
            deleteAccessToken(id: $id) {
                data
            }
        }
    }
`;
