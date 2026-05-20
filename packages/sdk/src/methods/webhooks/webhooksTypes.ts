export interface Webhook {
    id: string;
    name: string;
    slug: string;
    endpointUrl: string;
    description: string | null;
    enabled: boolean;
    events: string[];
    signingSecret: string;
    createdOn: string | null;
    modifiedOn: string | null;
}

export interface WebhookDelivery {
    id: string;
    webhookId: string;
    backgroundTaskId: string | null;
    eventType: string;
    status: string;
    payload: unknown;
    requestHeaders: unknown;
    responseTime: number | null;
    responseStatus: number | null;
    responseBody: string | null;
    expiresAt: string | null;
    createdOn: string | null;
}

export interface WebhookEvent {
    app: string;
    appLabel: string;
    entity: string;
    entityLabel: string;
    eventName: string;
    label: string;
}
