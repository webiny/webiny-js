import gql from "graphql-tag";

const fields = /* GraphQL */ `
    {
        data {
            uploadMinFileSize
            uploadMaxFileSize
            srcPrefix
        }
        error {
            message
            data
            code
            stack
        }
    }
`;

export interface GetSettingsResponse {
    fileManager: {
        getSettings: {
            data: Record<string, any>;
        };
    };
}

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
