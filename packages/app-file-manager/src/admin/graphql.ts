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
                fileManager {
                    getSettings${fields}
                }
            }
        `,
    UPDATE_SETTINGS: gql`
        mutation updateSettings($data: FileManagerSettingsInput) {
            fileManager {
                updateSettings(data: $data) ${fields}
            }
        }
    `
};

export default graphql;
