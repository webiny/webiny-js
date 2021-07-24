const TOKEN_FIELDS = /* GraphQL */ `
    {
        id
        name
        token
        createdOn
    }
`;

const USER_FIELDS = /* GraphQL */ `
    {
        login
        personalAccessTokens ${TOKEN_FIELDS}
    }
`;

const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const GET_CURRENT_SECURITY_USER_WITH_PAT = /* GraphQL */ `
    query GetCurrentUser {
        security {
            getCurrentUser {
                data ${USER_FIELDS}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const CREATE_SECURITY_USER_PAT = /* GraphQL */ `
    mutation CreatePAT($data: SecurityPersonalAccessTokenInput!) {
        security {
            createPAT(data: $data) {
                data {
                    pat ${TOKEN_FIELDS}
                    token
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const UPDATE_CURRENT_SECURITY_USER_PAT = /* GraphQL */ `
    mutation UpdatePAT($id: ID!, $data: SecurityPersonalAccessTokenInput!) {
        security {
            updatePAT(id: $id, data: $data) {
                data ${TOKEN_FIELDS}
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const DELETE_CURRENT_SECURITY_USER_PAT = /* GraphQL */ `
    mutation DeletePAT($id: ID!) {
        security {
            deletePAT(id: $id) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;
