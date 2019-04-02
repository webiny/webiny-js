// @flow
import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        data {
            enabled
            code
        }
    }
`;

const graphql = {
    query: gql`
            query getSettings {
                settings {
                    googleTagManager ${fields}
                }
            }
        `,
    mutation: gql`
            mutation updateSettings($data: GoogleTagManagerSettingsInput) {
                settings {
                    googleTagManager(data: $data) ${fields}
                }
            }
        `
};

export default graphql;
