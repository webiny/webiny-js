const ERROR = /* GraphQL */ `
    error {
        message
        code
        data
        stack
    }
`;

const WEBHOOK_FIELDS = /* GraphQL */ `
    id
    name
    slug
    endpointUrl
    description
    enabled
    events
    signingSecret
    createdOn
    modifiedOn
`;

export const CREATE_WEBHOOK = /* GraphQL */ `
    mutation CreateWebhook($input: CreateWebhookInput!) {
        webhooks {
            createWebhook(input: $input) {
                data {
                    ${WEBHOOK_FIELDS}
                }
                ${ERROR}
            }
        }
    }
`;

export const UPDATE_WEBHOOK = /* GraphQL */ `
    mutation UpdateWebhook($id: ID!, $input: UpdateWebhookInput!) {
        webhooks {
            updateWebhook(id: $id, input: $input) {
                data {
                    ${WEBHOOK_FIELDS}
                }
                ${ERROR}
            }
        }
    }
`;

export const DELETE_WEBHOOK = /* GraphQL */ `
    mutation DeleteWebhook($id: ID!) {
        webhooks {
            deleteWebhook(id: $id) {
                data
                error {
                    message
                    code
                    data
                    stack
                }
            }
        }
    }
`;

export const GET_WEBHOOK = /* GraphQL */ `
    query GetWebhook($id: ID!) {
        webhooks {
            getWebhook(id: $id) {
                data {
                    ${WEBHOOK_FIELDS}
                }
                ${ERROR}
            }
        }
    }
`;

export const LIST_WEBHOOKS = /* GraphQL */ `
    query ListWebhooks($where: ListWebhooksWhereInput, $limit: Int, $after: String) {
        webhooks {
            listWebhooks(where: $where, limit: $limit, after: $after) {
                data {
                    ${WEBHOOK_FIELDS}
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
