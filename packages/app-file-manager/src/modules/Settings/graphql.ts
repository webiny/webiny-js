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

export const GET_SETTINGS = /* GraphQL */ `
    query GetFileManagerSettings {
        fileManager {
            getSettings${fields}
        }
    }
`;

export const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateFileManagerSettings($data: FmSettingsInput) {
        fileManager {
            updateSettings(data: $data) ${fields}
        }
    }
`;
