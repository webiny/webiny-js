export const SEND_TEST_MAIL_MUTATION = `
    mutation SendTestMail($to: String!) {
        mailer {
            sendTestMail(to: $to) {
                data
                error {
                    message
                    code
                    data
                }
            }
        }
    }
`;
