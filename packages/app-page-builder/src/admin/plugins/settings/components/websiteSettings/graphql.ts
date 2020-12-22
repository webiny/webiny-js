import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        id
        data {
            websiteUrl
            websitePreviewUrl
            name
            logo {
                id
                src
            }
            favicon {
                id
                src
            }
            social {
                facebook
                twitter
                instagram
                image {
                    id
                    src
                }
            }
        }
        error {
            message
        }
    }
`;

export const GET_SETTINGS = gql`
        query GetSettings {
            pageBuilder {
                getSettings ${fields}
                getDefaultSettings ${fields}
            }
        }
    `;

export const UPDATE_SETTINGS = gql`
    mutation updateSettings($data: PbSettingsInput!) {
        pageBuilder {
            updateSettings(data: $data) ${fields}
        }
    }
`;
