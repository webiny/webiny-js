// @flow
import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        data {
            reCaptcha {
                enabled
                siteKey
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
                    forms ${fields}
                }
            }
        `,
    mutation: gql`
            mutation updateSettings($data: FormsSettingsInput) {
                settings {
                    forms(data: $data) ${fields}
                }
            }
        `
};

export default graphql;
