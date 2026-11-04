import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { NotificationTransportInfo } from "~/domain/notifications/types.js";

/**
 * ListNotificationTransports use case interface. Internal (D132): no permission check, so no
 * error of its own; the shared transports operation checks `editor` (D133).
 */
export interface IListNotificationTransportsUseCase {
    execute(): Promise<Result<NotificationTransportInfo[]>>;
}

export const ListNotificationTransportsUseCase =
    createAbstraction<IListNotificationTransportsUseCase>("ListNotificationTransportsUseCase");

export namespace ListNotificationTransportsUseCase {
    export type Interface = IListNotificationTransportsUseCase;
    export type Return = Promise<Result<NotificationTransportInfo[]>>;
}

/**
 * ListNotificationTransports repository interface
 */
export interface IListNotificationTransportsRepository {
    execute(): Promise<Result<NotificationTransportInfo[]>>;
}

export const ListNotificationTransportsRepository =
    createAbstraction<IListNotificationTransportsRepository>(
        "ListNotificationTransportsRepository"
    );

export namespace ListNotificationTransportsRepository {
    export type Interface = IListNotificationTransportsRepository;
    export type Return = Promise<Result<NotificationTransportInfo[]>>;
}
