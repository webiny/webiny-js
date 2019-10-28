// @flow
import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
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

const graphql = {
    query: gql`
        query PbGetSettings{
            pageBuilder {
                getSettings ${fields}
            }
        }
    `,
    mutation: gql`
        mutation PbUpdateSettings($data: PbSettingsInput) {
            pageBuilder {
                updateSettings(data: $data) ${fields}
            }
        }
    `
};

export default graphql;
