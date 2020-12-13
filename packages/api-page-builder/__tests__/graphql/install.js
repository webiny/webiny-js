export const IS_INSTALLED = /* GraphQL */ `
    query IsInstalled {
        pageBuilder {
            isInstalled {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export const INSTALL = /* GraphQL */ `
    mutation Install($data: PbInstallInput!) {
        pageBuilder {
            install(data: $data) {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;
