export const DATA_FIELD = /* GraphQL */ `
    {
        name
        websiteUrl
        websitePreviewUrl
        pages {
            home
            notFound
        }
        social {
            instagram
            facebook
            twitter
            image {
                src
                id
            }
        }
    }
`;

export const DEFAULT_SETTINGS_DATA_FIELD = /* GraphQL */ `
    {
        websiteUrl
        websitePreviewUrl
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
    mutation UpdateSettings($data: PbSettingsInput!) {
        pageBuilder {
            updateSettings(data: $data) {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;

export const GET_SETTINGS = /* GraphQL */ `
    query GetSettings {
        pageBuilder {
            getSettings {
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
export const GET_DEFAULT_SETTINGS = /* GraphQL */ `
    query GetDefaultSettings {
        pageBuilder {
            getDefaultSettings {
                data ${DEFAULT_SETTINGS_DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
