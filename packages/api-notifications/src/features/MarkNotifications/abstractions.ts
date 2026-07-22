import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { INotification } from "~/domain/notification/abstractions.js";
import type {
    NotificationNotAuthorizedError,
    NotificationNotFoundError,
    NotificationPersistenceError
} from "~/domain/notification/errors.js";

export type MarkNotificationError =
    | NotificationNotFoundError
    | NotificationNotAuthorizedError
    | NotificationPersistenceError;

export interface IMarkNotificationReadUseCase {
    execute(id: string): Promise<Result<INotification, MarkNotificationError>>;
}

export const MarkNotificationReadUseCase = createAbstraction<IMarkNotificationReadUseCase>(
    "MarkNotificationReadUseCase"
);

export namespace MarkNotificationReadUseCase {
    export type Interface = IMarkNotificationReadUseCase;
    export type Error = MarkNotificationError;
}

export interface IMarkAllNotificationsReadUseCase {
    execute(): Promise<Result<number, NotificationNotFoundError | NotificationPersistenceError>>;
}

export const MarkAllNotificationsReadUseCase = createAbstraction<IMarkAllNotificationsReadUseCase>(
    "MarkAllNotificationsReadUseCase"
);

export namespace MarkAllNotificationsReadUseCase {
    export type Interface = IMarkAllNotificationsReadUseCase;
}
