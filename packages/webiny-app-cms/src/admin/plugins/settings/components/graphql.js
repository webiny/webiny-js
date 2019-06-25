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
