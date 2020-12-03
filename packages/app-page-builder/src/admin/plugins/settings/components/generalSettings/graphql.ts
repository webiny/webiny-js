import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        id
        data {
            domain
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
