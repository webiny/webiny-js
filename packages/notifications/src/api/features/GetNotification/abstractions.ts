import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { INotification } from "~/api/domain/notification/abstractions.js";
import type {
    NotificationNotAuthorizedError,
    NotificationNotFoundError,
    NotificationPersistenceError
} from "~/api/domain/notification/errors.js";

export interface IGetNotificationRepository {
    execute(
        id: string
    ): Promise<Result<INotification, NotificationNotFoundError | NotificationPersistenceError>>;
}

export interface IGetNotificationRepositoryErrors {
    notFound: NotificationNotFoundError;
    persistence: NotificationPersistenceError;
}

type RepositoryError = IGetNotificationRepositoryErrors[keyof IGetNotificationRepositoryErrors];

export const GetNotificationRepository = createAbstraction<IGetNotificationRepository>(
    "GetNotificationRepository"
);

export namespace GetNotificationRepository {
    export type Interface = IGetNotificationRepository;
    export type Return = Promise<Result<INotification, RepositoryError>>;
    export type Error = RepositoryError;
}

export interface IGetNotificationUseCase {
    execute(id: string): Promise<Result<INotification, UseCaseError>>;
}

export interface IGetNotificationUseCaseErrors {
    notFound: NotificationNotFoundError;
    notAuthorized: NotificationNotAuthorizedError;
    persistence: NotificationPersistenceError;
}

type UseCaseError = IGetNotificationUseCaseErrors[keyof IGetNotificationUseCaseErrors];

export const GetNotificationUseCase =
    createAbstraction<IGetNotificationUseCase>("GetNotificationUseCase");

export namespace GetNotificationUseCase {
    export type Interface = IGetNotificationUseCase;
    export type Return = Promise<Result<INotification, UseCaseError>>;
    export type Error = UseCaseError;
}
