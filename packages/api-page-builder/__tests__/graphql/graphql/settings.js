export const DATA_FIELD = /* GraphQL */ `
    {
        name
        websiteUrl
        websitePreviewUrl
        prerendering {
            app {
                url
            }
            storage {
                name
            }
        }
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
                id
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
                id
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
                id
                data ${DATA_FIELD}
                error ${ERROR_FIELD}
            }
        }
    }
`;
