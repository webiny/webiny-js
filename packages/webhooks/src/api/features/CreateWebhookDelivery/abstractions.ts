import { createAbstraction, type Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { WebhookDelivery, WebhookDeliveryStatus } from "~/api/domain/WebhookDelivery.js";
import type { WebhookPersistenceError, WebhookModelNotFoundError } from "~/api/domain/errors.js";

export interface ICreateDeliveryInput {
    webhookId: string;
    eventType: string;
    status: WebhookDeliveryStatus;
    payload: GenericRecord;
    expiresAt: string;
}

type IError = WebhookPersistenceError | WebhookModelNotFoundError;

export interface ICreateWebhookDeliveryRepository {
    execute(input: ICreateDeliveryInput): Promise<Result<WebhookDelivery, IError>>;
}

export const CreateWebhookDeliveryRepository = createAbstraction<ICreateWebhookDeliveryRepository>(
    "Webhooks/CreateWebhookDeliveryRepository"
);

export namespace CreateWebhookDeliveryRepository {
    export type Interface = ICreateWebhookDeliveryRepository;
    export type Error = IError;
}
