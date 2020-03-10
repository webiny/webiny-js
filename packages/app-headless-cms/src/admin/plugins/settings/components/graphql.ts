import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        data {
            reCaptcha {
                enabled
                siteKey
                secretKey
            }
            domain
        }
        error {
            message
        }
    }
`;

const graphql = {
    query: gql`
            query GetSettings { 
                forms {
                    getSettings 
                        ${fields}
                }
            }
        `,
    mutation: gql`
            mutation UpdateSettings($data: FormsSettingsInput) {
                forms {
                    updateSettings(data: $data) ${fields}
                }
            }
        `
};

export default graphql;
