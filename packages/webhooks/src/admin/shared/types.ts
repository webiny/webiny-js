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
    entity: string;
    eventName: string;
    label: string;
}
