import { createAbstraction } from "@webiny/feature/api";

/**
 * Sent to the user's open admin tabs when a role changes. The admin keeps its own roles list, and a
 * change made on the server (by the assistant's role tools, for one) never passes through it, so
 * without these the Roles view shows the old list until a reload. Each carries the role id only; the
 * admin reads the role back, or drops it for `deleted`.
 */
export const ROLE_CREATED_WEBSOCKET_ACTION = "security.role.created";
export const ROLE_UPDATED_WEBSOCKET_ACTION = "security.role.updated";
export const ROLE_DELETED_WEBSOCKET_ACTION = "security.role.deleted";

export interface NotifyRoleChangeParams {
    id: string;
    change: "created" | "updated" | "deleted";
}

export interface INotifyRoleChangeUseCase {
    execute(params: NotifyRoleChangeParams): Promise<void>;
}

export const NotifyRoleChangeUseCase = createAbstraction<INotifyRoleChangeUseCase>(
    "Security/NotifyRoleChangeUseCase"
);

export namespace NotifyRoleChangeUseCase {
    export type Interface = INotifyRoleChangeUseCase;
    export type Params = NotifyRoleChangeParams;
}
