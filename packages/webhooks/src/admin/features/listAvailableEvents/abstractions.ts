import { createAbstraction } from "@webiny/feature/admin";
import type { WebhookEvent } from "~/admin/shared/types.js";

export interface IListAvailableEventsGateway {
    execute(): Promise<WebhookEvent[]>;
}

export const ListAvailableEventsGateway = createAbstraction<IListAvailableEventsGateway>(
    "ListAvailableEventsGateway"
);

export namespace ListAvailableEventsGateway {
    export type Interface = IListAvailableEventsGateway;
}

export interface IListAvailableEventsUseCase {
    execute(): Promise<WebhookEvent[]>;
}

export const ListAvailableEventsUseCase = createAbstraction<IListAvailableEventsUseCase>(
    "ListAvailableEventsUseCase"
);

export namespace ListAvailableEventsUseCase {
    export type Interface = IListAvailableEventsUseCase;
}
