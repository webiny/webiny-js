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
                settings {
                    mailchimp ${fields}
                }
            }
        `,
    mutation: gql`
            mutation updateSettings($data: MailchimpSettingsInput) {
                settings {
                    mailchimp(data: $data) ${fields}
                }
            }
        `
};

export default graphql;
