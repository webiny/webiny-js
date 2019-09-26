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
        {
            pageBuilder {
                getSettings ${fields}
            }
        }
    `,
    mutation: gql`
        mutation updateSettings($data: PbSettingsInput) {
            pageBuilder {
                updateSettings(data: $data) ${fields}
            }
        }
    `
};

export default graphql;
