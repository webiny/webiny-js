import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { INotificationWhere } from "~/api/domain/notification/abstractions.js";
import type { NotificationPersistenceError } from "~/api/domain/notification/errors.js";

export interface INotificationCounts {
    inbox: number;
    archive: number;
    unread: number;
}

export interface INotificationCountsUseCase {
    execute(): Promise<Result<INotificationCounts, NotificationPersistenceError>>;
}

export const NotificationCountsUseCase = createAbstraction<INotificationCountsUseCase>(
    "NotificationCountsUseCase"
);

export namespace NotificationCountsUseCase {
    export type Interface = INotificationCountsUseCase;
    export type Counts = INotificationCounts;
}

export interface ICountNotificationsRepository {
    execute(where: INotificationWhere): Promise<Result<number, NotificationPersistenceError>>;
}

export const CountNotificationsRepository = createAbstraction<ICountNotificationsRepository>(
    "CountNotificationsRepository"
);

export namespace CountNotificationsRepository {
    export type Interface = ICountNotificationsRepository;
    export type Return = Promise<Result<number, NotificationPersistenceError>>;
}
