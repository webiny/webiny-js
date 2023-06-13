export const GET_SETTINGS_QUERY = `
    query GetSettings {
        mailer {
            getSettings {
                data {
                    host
                    user
                    from
                    replyTo
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

export const SAVE_SETTINGS_MUTATION = `
    mutation SaveSettings($data: MailerTransportSettingsInput!) {
        mailer {
            saveSettings(data: $data) {
                data {
                    host
                    user
                    from
                    replyTo
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
