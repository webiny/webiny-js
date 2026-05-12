import { type Result, BaseError, createAbstraction } from "@webiny/feature/api";
import type { IWebhook } from "~/api/domain/types.js";

export interface IGetWebhookRepository {
    execute(id: string): Promise<Result<IWebhook, BaseError>>;
}

export const GetWebhookRepository = createAbstraction<IGetWebhookRepository>(
    "Webhooks/GetWebhookRepository"
);

export namespace GetWebhookRepository {
    export type Interface = IGetWebhookRepository;
}
