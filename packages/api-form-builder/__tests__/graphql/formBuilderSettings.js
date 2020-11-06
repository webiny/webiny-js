export const DATA_FIELD = /* GraphQL */ `
    {
        domain
        reCaptcha {
            enabled
            siteKey
            secretKey
        }
    }
`;

export const ERROR_FIELD = /* GraphQL */ `
    {
        code
        data
        message
    }
`;

export const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateSettings($data: FormsSettingsInput) {
        forms {
            updateSettings(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_SETTINGS = /* GraphQL */ `
    query GetSettings {
        forms {
            getSettings {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const IS_INSTALLED = /* GraphQL */ `
    query IsInstalled {
        forms {
            isInstalled {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const INSTALL = /* GraphQL */ `
    mutation Install($domain: String) {
        forms {
            install(domain: $domain) {
                data
                error ${ERROR_FIELD}
            }
        }
    }
`;
