const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;
export const IS_INSTALLED = /* GraphQL */ `
    query IsInstalled {
        security {
            version
        }
    }
`;

export const INSTALL = /* GraphQL */ `
    mutation Install($data: SecurityInstallInput!) {
        security {
            install(data: $data) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;
