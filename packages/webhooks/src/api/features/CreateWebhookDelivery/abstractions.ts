import { type Result, BaseError, createAbstraction } from "@webiny/feature/api";
import type { ICreateDeliveryInput } from "~/api/domain/types.js";

export interface ICreateWebhookDeliveryRepository {
    execute(input: ICreateDeliveryInput): Promise<Result<void, BaseError>>;
}

export const CreateWebhookDeliveryRepository = createAbstraction<ICreateWebhookDeliveryRepository>(
    "Webhooks/CreateWebhookDeliveryRepository"
);

export namespace CreateWebhookDeliveryRepository {
    export type Interface = ICreateWebhookDeliveryRepository;
}
