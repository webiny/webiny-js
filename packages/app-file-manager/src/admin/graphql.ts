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
    GET_SETTINGS: gql`
            query getSettings {
                files {
                    getSettings${fields}
                }
            }
        `,
    UPDATE_SETTINGS: gql`
        mutation updateSettings($data: FileManagerSettingsInput) {
            files {
                updateSettings(data: $data) ${fields}
            }
        }
    `
};

export default graphql;
