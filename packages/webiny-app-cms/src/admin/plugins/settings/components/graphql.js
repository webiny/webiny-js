// @flow
import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        pages {
            home
            notFound
            error
        }
        social {
            image {
                src
            }
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
