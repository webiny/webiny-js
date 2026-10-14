import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { INotification } from "~/api/domain/notification/abstractions.js";
import type {
    NotificationNotAuthorizedError,
    NotificationNotFoundError,
    NotificationPersistenceError
} from "~/api/domain/notification/errors.js";

export interface IUpdateNotificationRepository {
    execute(
        notification: INotification
    ): Promise<Result<INotification, NotificationNotFoundError | NotificationPersistenceError>>;
}

export interface IUpdateNotificationRepositoryErrors {
    notFound: NotificationNotFoundError;
    persistence: NotificationPersistenceError;
}

type RepositoryError =
    IUpdateNotificationRepositoryErrors[keyof IUpdateNotificationRepositoryErrors];

export const UpdateNotificationRepository = createAbstraction<IUpdateNotificationRepository>(
    "UpdateNotificationRepository"
);

export namespace UpdateNotificationRepository {
    export type Interface = IUpdateNotificationRepository;
    export type Return = Promise<Result<INotification, RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IUpdateNotificationUseCase {
    execute(notification: INotification): Promise<Result<INotification, UseCaseError>>;
}

export interface IUpdateNotificationUseCaseErrors {
    notFound: NotificationNotFoundError;
    notAuthorized: NotificationNotAuthorizedError;
    persistence: NotificationPersistenceError;
}

type UseCaseError = IUpdateNotificationUseCaseErrors[keyof IUpdateNotificationUseCaseErrors];

export const UpdateNotificationUseCase = createAbstraction<IUpdateNotificationUseCase>(
    "UpdateNotificationUseCase"
);

export namespace UpdateNotificationUseCase {
    export type Interface = IUpdateNotificationUseCase;
    export type Return = Promise<Result<INotification, UseCaseError>>;
    export type Error = UseCaseError;
}
