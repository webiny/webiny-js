import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type { INotificationListResult } from "~/domain/notification/abstractions.js";
import type { NotificationPersistenceError } from "~/domain/notification/errors.js";

export interface IListNotificationsParams {
    archived?: boolean;
    read?: boolean;
    limit?: number;
    after?: string | null;
}

export interface IListNotificationsUseCase {
    execute(
        params: IListNotificationsParams
    ): Promise<Result<INotificationListResult, NotificationPersistenceError>>;
}

export const ListNotificationsUseCase = createAbstraction<IListNotificationsUseCase>(
    "ListNotificationsUseCase"
);

export namespace ListNotificationsUseCase {
    export type Interface = IListNotificationsUseCase;
    export type Params = IListNotificationsParams;
}
