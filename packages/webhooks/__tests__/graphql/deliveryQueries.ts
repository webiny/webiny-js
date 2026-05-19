const ERROR = /* GraphQL */ `
    error {
        message
        code
        data
    }
`;

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

export const LIST_WEBHOOK_DELIVERIES = /* GraphQL */ `
    query ListWebhookDeliveries($webhookId: ID!, $limit: Int, $after: String) {
        webhooks {
            listWebhookDeliveries(webhookId: $webhookId, limit: $limit, after: $after) {
                data {
                    ${DELIVERY_FIELDS}
                }
                meta {
                    cursor
                    hasMoreItems
                    totalCount
                }
                ${ERROR}
            }
        }
    }
`;

export const GET_WEBHOOK_DELIVERY = /* GraphQL */ `
    query GetWebhookDelivery($id: ID!) {
        webhooks {
            getWebhookDelivery(id: $id) {
                data {
                    ${DELIVERY_FIELDS}
                }
                ${ERROR}
            }
        }
    }
`;

export const RESEND_WEBHOOK_DELIVERY = /* GraphQL */ `
    mutation ResendWebhookDelivery($id: ID!) {
        webhooks {
            resendWebhookDelivery(id: $id) {
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
