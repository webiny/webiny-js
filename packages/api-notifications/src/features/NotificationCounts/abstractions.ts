import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { NotificationPersistenceError } from "~/domain/notification/errors.js";

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
