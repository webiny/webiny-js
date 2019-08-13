// @flow
import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        data {
            enabled
            apiKey
        }
        error {
            message
        }
    }
`;

const graphql = {
    query: gql`
            query getSettings {
                mailchimp {
                    getSettings ${fields}
                }
            }
        `,
    mutation: gql`
            mutation updateSettings($data: MailchimpSettingsInput) {
                mailchimp {
                    updateSettings(data: $data) ${fields}
                }
            }
        `
};

export default graphql;
