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
                googleTagManager {
                    getSettings${fields}
                }
            }
        `,
    mutation: gql`
            mutation updateSettings($data: GoogleTagManagerSettingsInput) {
                googleTagManager {
                    updateSettings(data: $data) ${fields}
                }
            }
        `
};

export default graphql;
