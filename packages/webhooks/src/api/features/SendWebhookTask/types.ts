export interface ISendWebhookTaskInput {
    webhookId: string;
    eventName: string;
    deliveryId: string;
}

export interface ISendWebhookTaskOutput {}

export interface IWebhookPayload {
    id: string;
    event: string;
    timestamp: string;
    webhookId: string;
    deliveryId: string;
    tenant: string;
    data: unknown;
}
