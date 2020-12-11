import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        id
        data {
            pages {
                home
                notFound
                error
            }
            social {
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
    query PbGetSettings{
        pageBuilder {
            getSettings ${fields}
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
