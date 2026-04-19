export const GET_SETTINGS_QUERY = `
    query GetSettings {
        mailer {
            getSettings {
                data {
                    host
                    port
                    user
                    password
                    from
                    replyTo
                }
                source
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
                success
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;
