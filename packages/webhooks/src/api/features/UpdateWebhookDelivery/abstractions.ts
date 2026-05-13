import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IUpdateDeliveryInput, IWebhookDelivery } from "~/api/domain/types.js";
import type {
    WebhookPersistenceError,
    WebhookModelNotFoundError,
    WebhookDeliveryNotFoundError
} from "~/api/domain/errors.js";

type IError = WebhookPersistenceError | WebhookModelNotFoundError | WebhookDeliveryNotFoundError;

export interface IUpdateWebhookDeliveryRepository {
    execute(id: string, input: IUpdateDeliveryInput): Promise<Result<IWebhookDelivery, IError>>;
}

export const UpdateWebhookDeliveryRepository = createAbstraction<IUpdateWebhookDeliveryRepository>(
    "Webhooks/UpdateWebhookDeliveryRepository"
);

export namespace UpdateWebhookDeliveryRepository {
    export type Interface = IUpdateWebhookDeliveryRepository;
    export type Error = IError;
}
