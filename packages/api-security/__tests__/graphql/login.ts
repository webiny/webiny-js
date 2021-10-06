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
                    ...on Admin {
                        id
                        displayName
                        permissions
                        type
                        tenant {
                            id
                            name
                        }
                    }
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;
