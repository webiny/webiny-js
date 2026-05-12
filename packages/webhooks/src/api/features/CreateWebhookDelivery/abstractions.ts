import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ICreateDeliveryInput, IWebhookDelivery } from "~/api/domain/types.js";
import type { WebhookPersistenceError, WebhookModelNotFoundError } from "~/api/domain/errors.js";

type IError = WebhookPersistenceError | WebhookModelNotFoundError;

export interface ICreateWebhookDeliveryRepository {
    execute(input: ICreateDeliveryInput): Promise<Result<IWebhookDelivery, IError>>;
}

export const CreateWebhookDeliveryRepository = createAbstraction<ICreateWebhookDeliveryRepository>(
    "Webhooks/CreateWebhookDeliveryRepository"
);

export namespace CreateWebhookDeliveryRepository {
    export type Interface = ICreateWebhookDeliveryRepository;
    export type Error = IError;
}
