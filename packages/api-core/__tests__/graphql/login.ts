const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const LOGIN = /* GraphQL */ `
    mutation Login {
        security {
            login {
                data {
                    ... on SecurityIdentity {
                        id
                        displayName
                        permissions
                        type
                    }
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;
