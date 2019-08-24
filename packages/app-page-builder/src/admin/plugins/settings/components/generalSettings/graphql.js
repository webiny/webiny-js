// @flow
import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
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

const graphql = {
    query: gql`
        query GetSettings {
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
