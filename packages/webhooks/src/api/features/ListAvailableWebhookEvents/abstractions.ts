import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IWebhookEventDefinition } from "~/api/domain/types.js";

export interface IListAvailableWebhookEventsUseCase {
    execute(): Promise<Result<IWebhookEventDefinition[], Error>>;
}

export const ListAvailableWebhookEventsUseCase =
    createAbstraction<IListAvailableWebhookEventsUseCase>(
        "Webhooks/ListAvailableWebhookEventsUseCase"
    );

export namespace ListAvailableWebhookEventsUseCase {
    export type Interface = IListAvailableWebhookEventsUseCase;
}
