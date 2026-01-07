import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { INotificationType } from "~/domain/notification/abstractions.js";
import { NotificationAuthorizedError } from "~/domain/notification/errors.js";

/**
 * ListNotificationTypes use case interface
 */
export interface IListNotificationTypesUseCase {
    execute(): Promise<Result<INotificationType[], UseCaseError>>;
}

export interface IListNotificationTypesUseCaseErrors {
    notAuthorized: NotificationAuthorizedError;
}

type UseCaseError = IListNotificationTypesUseCaseErrors[keyof IListNotificationTypesUseCaseErrors];

export const ListNotificationTypesUseCase = createAbstraction<IListNotificationTypesUseCase>(
    "ListNotificationTypesUseCase"
);

export namespace ListNotificationTypesUseCase {
    export type Interface = IListNotificationTypesUseCase;
    export type Return = Promise<Result<INotificationType[], UseCaseError>>;
    export type Error = UseCaseError;
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
