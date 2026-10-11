import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { INotificationType } from "~/domain/notifications/abstractions.js";

/**
 * ListNotificationTypes use case interface. Internal (D132): no permission check, so no error of
 * its own; the shared transports operation checks `editor` (D133).
 */
export interface IListNotificationTypesUseCase {
    execute(): Promise<Result<INotificationType[]>>;
}

export const ListNotificationTypesUseCase = createAbstraction<IListNotificationTypesUseCase>(
    "ListNotificationTypesUseCase"
);

export namespace ListNotificationTypesUseCase {
    export type Interface = IListNotificationTypesUseCase;
    export type Return = Promise<Result<INotificationType[]>>;
}

/**
 * ListNotificationTypes repository interface
 */
export interface IListNotificationTypesRepository {
    execute(): Promise<Result<INotificationType[]>>;
}

export const ListNotificationTypesRepository = createAbstraction<IListNotificationTypesRepository>(
    "ListNotificationTypesRepository"
);

export namespace ListNotificationTypesRepository {
    export type Interface = IListNotificationTypesRepository;
    export type Return = Promise<Result<INotificationType[]>>;
}
