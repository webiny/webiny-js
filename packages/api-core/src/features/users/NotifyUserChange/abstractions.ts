import { createAbstraction } from "@webiny/feature/api";

/**
 * Sent to the user's open admin tabs when an admin user changes. The admin keeps its own users list
 * and user form, and a change made on the server (by the assistant's user tools, for one) never
 * passes through them, so without these the Users view shows the old data until a reload. Each
 * carries the user id only; the admin reads the user back, or drops it for `deleted`.
 */
export const USER_CREATED_WEBSOCKET_ACTION = "adminUsers.user.created";
export const USER_UPDATED_WEBSOCKET_ACTION = "adminUsers.user.updated";
export const USER_DELETED_WEBSOCKET_ACTION = "adminUsers.user.deleted";

export interface NotifyUserChangeParams {
    id: string;
    change: "created" | "updated" | "deleted";
}

export interface INotifyUserChangeUseCase {
    execute(params: NotifyUserChangeParams): Promise<void>;
}

export const NotifyUserChangeUseCase = createAbstraction<INotifyUserChangeUseCase>(
    "AdminUsers/NotifyUserChangeUseCase"
);

export namespace NotifyUserChangeUseCase {
    export type Interface = INotifyUserChangeUseCase;
    export type Params = NotifyUserChangeParams;
}
