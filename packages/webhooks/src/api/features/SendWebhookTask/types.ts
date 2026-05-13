export interface ISendWebhookTaskInput {
    webhookId: string;
    eventName: string;
    deliveryId: string;
    data: object;
}

export interface ISendWebhookTaskOutput {}
