import { createAbstraction } from "@webiny/feature/admin";
import type { Webhook } from "~/admin/shared/types.js";

export interface UpdateWebhookInput {
    name?: string;
    slug?: string;
    endpointUrl?: string;
    description?: string;
    enabled?: boolean;
    events?: string[];
}

export interface IUpdateWebhookGateway {
    execute(id: string, input: UpdateWebhookInput): Promise<Webhook>;
}

export const UpdateWebhookGateway =
    createAbstraction<IUpdateWebhookGateway>("UpdateWebhookGateway");

export namespace UpdateWebhookGateway {
    export type Interface = IUpdateWebhookGateway;
}

export interface IUpdateWebhookUseCase {
    execute(id: string, input: UpdateWebhookInput): Promise<Webhook>;
}

export const UpdateWebhookUseCase =
    createAbstraction<IUpdateWebhookUseCase>("UpdateWebhookUseCase");

export namespace UpdateWebhookUseCase {
    export type Interface = IUpdateWebhookUseCase;
}
