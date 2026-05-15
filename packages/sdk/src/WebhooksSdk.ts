import type { WebinyConfig } from "./types.js";
import type { HttpError } from "./errors.js";
import type { ApiError } from "./errors.js";
import type { NetworkError } from "./errors.js";
import type { ValidationError } from "./errors.js";
import type { Result } from "./Result.js";
import type { Webhook } from "./methods/webhooks/webhooksTypes.js";
import type { WebhookDelivery } from "./methods/webhooks/webhooksTypes.js";
import type { WebhookEvent } from "./methods/webhooks/webhooksTypes.js";
import type { GetWebhookParams } from "./methods/webhooks/getWebhook.js";
import type { ListWebhooksParams } from "./methods/webhooks/listWebhooks.js";
import type { ListWebhooksResult } from "./methods/webhooks/listWebhooks.js";
import type { CreateWebhookParams } from "./methods/webhooks/createWebhook.js";
import type { UpdateWebhookParams } from "./methods/webhooks/updateWebhook.js";
import type { DeleteWebhookParams } from "./methods/webhooks/deleteWebhook.js";
import type { GetWebhookDeliveryParams } from "./methods/webhooks/getWebhookDelivery.js";
import type { ListWebhookDeliveriesParams } from "./methods/webhooks/listWebhookDeliveries.js";
import type { ListWebhookDeliveriesResult } from "./methods/webhooks/listWebhookDeliveries.js";
import type { ResendWebhookDeliveryParams } from "./methods/webhooks/resendWebhookDelivery.js";
import type { TriggerWebhookParams } from "./methods/webhooks/triggerWebhook.js";
import { getWebhook as getWebhookFn } from "./methods/webhooks/getWebhook.js";
import { listWebhooks as listWebhooksFn } from "./methods/webhooks/listWebhooks.js";
import { createWebhook as createWebhookFn } from "./methods/webhooks/createWebhook.js";
import { updateWebhook as updateWebhookFn } from "./methods/webhooks/updateWebhook.js";
import { deleteWebhook as deleteWebhookFn } from "./methods/webhooks/deleteWebhook.js";
import { getWebhookDelivery as getWebhookDeliveryFn } from "./methods/webhooks/getWebhookDelivery.js";
import { listWebhookDeliveries as listWebhookDeliveriesFn } from "./methods/webhooks/listWebhookDeliveries.js";
import { resendWebhookDelivery as resendWebhookDeliveryFn } from "./methods/webhooks/resendWebhookDelivery.js";
import { listAvailableWebhookEvents as listAvailableWebhookEventsFn } from "./methods/webhooks/listAvailableWebhookEvents.js";
import { triggerWebhook as triggerWebhookFn } from "./methods/webhooks/triggerWebhook.js";

export class WebhooksSdk {
    private readonly config: WebinyConfig;
    private readonly fetchFn: typeof fetch;

    constructor(config: WebinyConfig) {
        this.config = config;
        this.fetchFn = config.fetch || fetch;
    }

    async getWebhook(
        params: GetWebhookParams
    ): Promise<Result<Webhook, HttpError | ApiError | NetworkError | ValidationError>> {
        return getWebhookFn(this.config, this.fetchFn, params);
    }

    async listWebhooks(
        params?: ListWebhooksParams
    ): Promise<Result<ListWebhooksResult, HttpError | ApiError | NetworkError | ValidationError>> {
        return listWebhooksFn(this.config, this.fetchFn, params ?? {});
    }

    async createWebhook(
        params: CreateWebhookParams
    ): Promise<Result<Webhook, HttpError | ApiError | NetworkError | ValidationError>> {
        return createWebhookFn(this.config, this.fetchFn, params);
    }

    async updateWebhook(
        params: UpdateWebhookParams
    ): Promise<Result<Webhook, HttpError | ApiError | NetworkError | ValidationError>> {
        return updateWebhookFn(this.config, this.fetchFn, params);
    }

    async deleteWebhook(
        params: DeleteWebhookParams
    ): Promise<Result<boolean, HttpError | ApiError | NetworkError | ValidationError>> {
        return deleteWebhookFn(this.config, this.fetchFn, params);
    }

    async getWebhookDelivery(
        params: GetWebhookDeliveryParams
    ): Promise<Result<WebhookDelivery, HttpError | ApiError | NetworkError | ValidationError>> {
        return getWebhookDeliveryFn(this.config, this.fetchFn, params);
    }

    async listWebhookDeliveries(
        params: ListWebhookDeliveriesParams
    ): Promise<
        Result<ListWebhookDeliveriesResult, HttpError | ApiError | NetworkError | ValidationError>
    > {
        return listWebhookDeliveriesFn(this.config, this.fetchFn, params);
    }

    async resendWebhookDelivery(
        params: ResendWebhookDeliveryParams
    ): Promise<Result<boolean, HttpError | ApiError | NetworkError | ValidationError>> {
        return resendWebhookDeliveryFn(this.config, this.fetchFn, params);
    }

    async listAvailableWebhookEvents(): Promise<
        Result<WebhookEvent[], HttpError | ApiError | NetworkError>
    > {
        return listAvailableWebhookEventsFn(this.config, this.fetchFn);
    }

    async triggerWebhook(
        params: TriggerWebhookParams
    ): Promise<Result<WebhookDelivery, HttpError | ApiError | NetworkError | ValidationError>> {
        return triggerWebhookFn(this.config, this.fetchFn, params);
    }
}
