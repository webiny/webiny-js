// @flow
import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        data {
            enabled
            position
            content {
                href
                message
                dismiss
                link
            }
            palette {
                popup {
                    background
                    text
                }
                button {
                    background
                    text
                }
            }
        }
    }
`;

const graphql = {
    query: gql`
            query cookiePolicy {
                cookiePolicy {
                    getSettings ${fields}
                }
            }
        `,
    mutation: gql`
            mutation cookiePolicy($data: CookiePolicySettingsInput) {
                cookiePolicy {
                    updateSettings(data: $data) ${fields}
                }
            }
        `
};

export default graphql;
