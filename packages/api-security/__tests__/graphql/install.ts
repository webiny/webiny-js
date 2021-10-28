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
    mutation Install {
        security {
            install {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const INSTALL_TENANCY = /* GraphQL */ `
    mutation InstallTenancy {
        tenancy {
            install {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;
