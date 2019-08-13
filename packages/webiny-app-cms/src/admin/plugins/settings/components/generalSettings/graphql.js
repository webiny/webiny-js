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
            query getSettings {
                cms {
                    getSettings ${fields}
                }
            }
        `,
    mutation: gql`
            mutation updateSettings($data: CmsSettingsInput) {
                cms {
                    updateSettings(data: $data) ${fields}
                }
            }
        `
};

export default graphql;
