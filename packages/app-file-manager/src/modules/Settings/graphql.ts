import gql from "graphql-tag";
import type { Settings } from "~/types.js";

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

export interface IUpdateSettingsResponse {
    fileManager: {
        updateSettings: {
            data: Settings | null;
            error: Error | null;
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
