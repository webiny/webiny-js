import { createAbstraction } from "@webiny/feature/admin";
import type { Webhook } from "~/admin/shared/types.js";

export interface IGetWebhookGateway {
    execute(id: string): Promise<Webhook>;
}

export const GetWebhookGateway = createAbstraction<IGetWebhookGateway>("GetWebhookGateway");

export namespace GetWebhookGateway {
    export type Interface = IGetWebhookGateway;
}

export interface IGetWebhookUseCase {
    execute(id: string): Promise<Webhook>;
}

export const GetWebhookUseCase = createAbstraction<IGetWebhookUseCase>("GetWebhookUseCase");

export namespace GetWebhookUseCase {
    export type Interface = IGetWebhookUseCase;
}
