import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { INotification } from "~/domain/notification/abstractions.js";
import type {
    NotificationNotAuthorizedError,
    NotificationNotFoundError,
    NotificationPersistenceError
} from "~/domain/notification/errors.js";

export type ArchiveNotificationError =
    | NotificationNotFoundError
    | NotificationNotAuthorizedError
    | NotificationPersistenceError;

export interface IArchiveNotificationUseCase {
    execute(id: string): Promise<Result<INotification, ArchiveNotificationError>>;
}

export const ArchiveNotificationUseCase = createAbstraction<IArchiveNotificationUseCase>(
    "ArchiveNotificationUseCase"
);

export namespace ArchiveNotificationUseCase {
    export type Interface = IArchiveNotificationUseCase;
    export type Error = ArchiveNotificationError;
}

export interface IUnarchiveNotificationUseCase {
    execute(id: string): Promise<Result<INotification, ArchiveNotificationError>>;
}

export const UnarchiveNotificationUseCase = createAbstraction<IUnarchiveNotificationUseCase>(
    "UnarchiveNotificationUseCase"
);

export namespace UnarchiveNotificationUseCase {
    export type Interface = IUnarchiveNotificationUseCase;
    export type Error = ArchiveNotificationError;
}
