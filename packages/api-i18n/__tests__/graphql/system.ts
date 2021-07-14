export const GET_VERSION = /* GraphQL */ `
    query GetVersion {
        i18n {
            version
        }
    }
`;

export const INSTALL = /* GraphQL */ `
    mutation InstallSystem($data: I18NInstallInput!) {
        i18n {
            install(data: $data) {
                data
                error {
                    message
                    data
                    code
                }
            }
        }
    }
`;
