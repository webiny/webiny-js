export interface IWebhookSettings {
    signingSecret: string | undefined;
    deliveryRetentionDays: number | undefined;
}
