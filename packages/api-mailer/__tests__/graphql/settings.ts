export const GET_SETTINGS_QUERY = `
    query GetSettings {
        mailer {
            getSettings {
                data {
                    host
                    user
                    password
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
    mutation SaveSettings($data: MailerSettingsResponse!) {
        mailer {
            saveSettings(data: $data) {
                data {
                    host
                    user
                    password
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
