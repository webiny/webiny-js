const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const IS_INSTALLED = /* GraphQL */ `
    query IsInstalled {
        files {
            isInstalled {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const INSTALL = /* GraphQL */ `
    mutation install($srcPrefix: String) {
        files {
            install(srcPrefix: $srcPrefix) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_SETTINGS = /* GraphQL */ `
    query GetSettings {
        files {
            getSettings {
                data {
                    uploadMinFileSize
                    uploadMaxFileSize
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateSettings($data: FileManagerSettingsInput) {
        files {
            updateSettings(data: $data) {
                data {
                    uploadMinFileSize
                    uploadMaxFileSize
                }
                error ${ERROR_FIELD}
            }
        }
    }
`;
