import { createAbstraction } from "@webiny/feature/admin";
import type { WebhookDelivery } from "~/admin/shared/types.js";

export interface ITriggerWebhookGateway {
    execute(id: string, payload: Record<string, unknown>): Promise<WebhookDelivery>;
}

export const TriggerWebhookGateway =
    createAbstraction<ITriggerWebhookGateway>("TriggerWebhookGateway");

export namespace TriggerWebhookGateway {
    export type Interface = ITriggerWebhookGateway;
}

export interface ITriggerWebhookUseCase {
    execute(id: string, payload: Record<string, unknown>): Promise<WebhookDelivery>;
}

export const TriggerWebhookUseCase =
    createAbstraction<ITriggerWebhookUseCase>("TriggerWebhookUseCase");

export namespace TriggerWebhookUseCase {
    export type Interface = ITriggerWebhookUseCase;
}
