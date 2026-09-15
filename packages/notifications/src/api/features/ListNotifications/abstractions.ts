import type { Result } from "@webiny/feature/api";
import { createAbstraction } from "@webiny/feature/api";
import type {
    INotificationListParams,
    INotificationListResult
} from "~/api/domain/notification/abstractions.js";
import type { NotificationPersistenceError } from "~/api/domain/notification/errors.js";

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

export interface IListNotificationsRepository {
    execute(
        params: INotificationListParams
    ): Promise<Result<INotificationListResult, NotificationPersistenceError>>;
}

export const ListNotificationsRepository = createAbstraction<IListNotificationsRepository>(
    "ListNotificationsRepository"
);

export namespace ListNotificationsRepository {
    export type Interface = IListNotificationsRepository;
    export type Return = Promise<Result<INotificationListResult, NotificationPersistenceError>>;
}
