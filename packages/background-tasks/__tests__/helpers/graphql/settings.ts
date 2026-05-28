export const createGetSettingsQuery = () => {
    return /* GraphQL */ `
        query GetBackgroundTaskSettings {
            backgroundTasks {
                getSettings {
                    data {
                        retentionDays
                    }
                    error {
                        message
                        code
                        data
                    }
                }
            }
        }
    `;
};

export interface IGetSettingsResponse {
    data: {
        backgroundTasks: {
            getSettings: {
                data: {
                    retentionDays: number | null;
                } | null;
                error: {
                    message: string;
                    code: string;
                    data: Record<string, any>;
                } | null;
            };
        };
    };
}

export const createUpdateSettingsMutation = () => {
    return /* GraphQL */ `
        mutation UpdateBackgroundTaskSettings($input: UpdateBackgroundTaskSettingsInput!) {
            backgroundTasks {
                updateSettings(input: $input) {
                    data {
                        retentionDays
                    }
                    error {
                        message
                        code
                        data
                    }
                }
            }
        }
    `;
};

export interface IUpdateSettingsVariables {
    input: {
        retentionDays?: number;
    };
}

export interface IUpdateSettingsResponse {
    data: {
        backgroundTasks: {
            updateSettings: {
                data: {
                    retentionDays: number | null;
                } | null;
                error: {
                    message: string;
                    code: string;
                    data: Record<string, any>;
                } | null;
            };
        };
    };
}
