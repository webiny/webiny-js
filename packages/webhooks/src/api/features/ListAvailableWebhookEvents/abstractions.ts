import { createAbstraction, type Result } from "@webiny/feature/api";
import type { IWebhookFactoryDefinition } from "@webiny/api-core/features/webhooks/Webhook/abstractions/WebhookFactory.js";

export interface IListAvailableWebhookEventsUseCase {
    execute(): Promise<Result<IWebhookFactoryDefinition[], Error>>;
}

export const ListAvailableWebhookEventsUseCase =
    createAbstraction<IListAvailableWebhookEventsUseCase>(
        "Webhooks/ListAvailableWebhookEventsUseCase"
    );

export namespace ListAvailableWebhookEventsUseCase {
    export type Interface = IListAvailableWebhookEventsUseCase;
}
