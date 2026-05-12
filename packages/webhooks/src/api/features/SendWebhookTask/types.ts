export interface ISendWebhookTaskInput {
    webhookId: string;
    eventName: string;
    data: object;
}

export interface ISendWebhookTaskOutput {
    deliveryId?: string;
}
