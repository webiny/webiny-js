import { createAbstraction, type Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { WebhookDelivery, WebhookDeliveryStatus } from "~/api/domain/WebhookDelivery.js";
import type {
    WebhookPersistenceError,
    WebhookModelNotFoundError,
    WebhookDeliveryNotFoundError
} from "~/api/domain/errors.js";

export interface IUpdateDeliveryInput {
    backgroundTaskId?: string;
    status?: WebhookDeliveryStatus;
    payload?: GenericRecord;
    requestHeaders?: object;
    responseTime?: number;
    responseStatus?: number;
    responseBody?: string;
}

type IError = WebhookPersistenceError | WebhookModelNotFoundError | WebhookDeliveryNotFoundError;

export interface IUpdateWebhookDeliveryRepository {
    execute(id: string, input: IUpdateDeliveryInput): Promise<Result<WebhookDelivery, IError>>;
}

export const UpdateWebhookDeliveryRepository = createAbstraction<IUpdateWebhookDeliveryRepository>(
    "Webhooks/UpdateWebhookDeliveryRepository"
);

export namespace UpdateWebhookDeliveryRepository {
    export type Interface = IUpdateWebhookDeliveryRepository;
    export type Error = IError;
}
