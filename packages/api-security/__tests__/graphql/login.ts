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
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;
