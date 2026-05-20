export const LIST_AVAILABLE_WEBHOOK_EVENTS = /* GraphQL */ `
    query ListAvailableWebhookEvents {
        webhooks {
            listAvailableWebhookEvents {
                data {
                    app
                    entity
                    eventName
                    label
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
