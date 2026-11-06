const ERROR = /* GraphQL */ `
    error {
        message
        code
        data
    }
`;

const SETTINGS_FIELDS = /* GraphQL */ `
    signingSecret
    deliveryRetentionDays
`;

export const GET_SETTINGS = /* GraphQL */ `
    query GetWebhookSettings {
        webhooks {
            getSettings {
                data {
                    ${SETTINGS_FIELDS}
                }
                ${ERROR}
            }
        }
    }
`;

export const UPDATE_SETTINGS = /* GraphQL */ `
    mutation UpdateWebhookSettings($input: UpdateWebhookSettingsInput!) {
        webhooks {
            updateSettings(input: $input) {
                data {
                    ${SETTINGS_FIELDS}
                }
                ${ERROR}
            }
        }
    }
`;
