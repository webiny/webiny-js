import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        data {
            uploadMinFileSize
            uploadMaxFileSize
            srcPrefix
        }
    }
`;

const graphql = {
    GET_SETTINGS: gql`
            query GetFileManagerSettings {
                fileManager {
                    getSettings${fields}
                }
            }
        `,
    UPDATE_SETTINGS: gql`
        mutation UpdateFileManagerSettings($data: FmSettingsInput) {
            fileManager {
                updateSettings(data: $data) ${fields}
            }
        }
    `
};

export default graphql;
