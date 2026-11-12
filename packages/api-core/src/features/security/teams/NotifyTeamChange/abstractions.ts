import { createAbstraction } from "@webiny/feature/api";

/**
 * Sent to the user's open admin tabs when a team changes. The admin keeps its own teams list, and a
 * change made on the server (by the assistant's team tools, for one) never passes through it, so
 * without these the Teams view shows the old list until a reload. Each carries the team id only; the
 * admin reads the team back, or drops it for `deleted`.
 */
export const TEAM_CREATED_WEBSOCKET_ACTION = "security.team.created";
export const TEAM_UPDATED_WEBSOCKET_ACTION = "security.team.updated";
export const TEAM_DELETED_WEBSOCKET_ACTION = "security.team.deleted";

export interface NotifyTeamChangeParams {
    id: string;
    change: "created" | "updated" | "deleted";
}

export interface INotifyTeamChangeUseCase {
    execute(params: NotifyTeamChangeParams): Promise<void>;
}

export const NotifyTeamChangeUseCase = createAbstraction<INotifyTeamChangeUseCase>(
    "Security/NotifyTeamChangeUseCase"
);

export namespace NotifyTeamChangeUseCase {
    export type Interface = INotifyTeamChangeUseCase;
    export type Params = NotifyTeamChangeParams;
}
