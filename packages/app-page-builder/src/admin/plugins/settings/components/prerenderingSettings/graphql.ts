import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        id
        data {
            prerendering {
                storage {
                    name
                }
                app {
                    url
                }
            }
        }
        error {
            code
            data
            message
        }
    }
`;

export const GET_SETTINGS = gql`
    query PbGetSettings{
        pageBuilder {
            getSettings ${fields}
            getDefaultSettings ${fields}
        }
    }
`;

export const UPDATE_SETTINGS = gql`
    mutation PbUpdateSettings($data: PbSettingsInput!) {
        pageBuilder {
            updateSettings(data: $data) ${fields}
        }
    }
`;
