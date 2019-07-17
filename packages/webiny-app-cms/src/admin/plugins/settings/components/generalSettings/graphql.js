// @flow
import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        data {
            name
            logo {
                src
            }
            favicon {
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
                settings {
                    cms ${fields}
                }
            }
        `,
    mutation: gql`
            mutation updateSettings($data: CmsSettingsInput) {
                settings {
                    cms(data: $data) ${fields}
                }
            }
        `
};

export default graphql;
