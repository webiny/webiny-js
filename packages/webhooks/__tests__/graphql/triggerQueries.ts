const DELIVERY_FIELDS = /* GraphQL */ `
    id
    webhookId
    backgroundTaskId
    eventType
    status
    payload
    requestHeaders
    responseTime
    responseStatus
    responseBody
    createdOn
`;

export const TRIGGER_WEBHOOK = /* GraphQL */ `
    mutation TriggerWebhook($id: ID!, $payload: JSON!) {
        webhooks {
            triggerWebhook(id: $id, payload: $payload) {
                data {
                    ${DELIVERY_FIELDS}
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
