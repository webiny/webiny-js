const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const IS_INSTALLED = /* GraphQL */ `
    query IsInstalled {
        fileManager {
            version
        }
    }
`;

export const INSTALL = /* GraphQL */ `
    mutation install($srcPrefix: String) {
        fileManager {
            install(srcPrefix: $srcPrefix) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_SETTINGS = /* GraphQL */ `
    query GetSettings {
        fileManager {
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
    mutation UpdateSettings($data: FmSettingsInput) {
        fileManager {
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
