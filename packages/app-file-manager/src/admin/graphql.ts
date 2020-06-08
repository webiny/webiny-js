import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        data {
            uploadMinFileSize
            uploadMaxFileSize
        }
    }
`;

const graphql = {
    query: gql`
            query getSettings {
                files {
                    getSettings${fields}
                }
            }
        `,
    mutation: gql`
        mutation updateSettings($data: FileManagerSettingsInput) {
            files {
                updateSettings(data: $data) ${fields}
            }
        }
    `
};

export default graphql;
