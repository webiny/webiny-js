const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;
export const IS_INSTALLED = /* GraphQL */ `
    query IsInstalled {
        system {
            isSystemInstalled {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const INSTALL = /* GraphQL */ `
    mutation Install ($installationInput: JSON!){
        system {
            installSystem(installationInput: $installationInput ) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;
