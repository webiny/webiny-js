import { createAbstraction } from "@webiny/feature/admin";
import type { NotificationTransport } from "~/editor/domain/types.js";

/*
 * Lists the notification transports a step can notify through. Throws a `GraphQLOperationError`
 * for a server error and the transport `Error` as is.
 */
export interface IListNotificationTransportsUseCase {
    execute(): Promise<NotificationTransport[]>;
}

export const ListNotificationTransportsUseCase =
    createAbstraction<IListNotificationTransportsUseCase>(
        "Workflows/ListNotificationTransportsUseCase"
    );

export namespace ListNotificationTransportsUseCase {
    export type Interface = IListNotificationTransportsUseCase;
}
