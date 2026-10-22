import { createAbstraction } from "@webiny/feature/api";

/**
 * Sent to the user's open admin tabs when a folder changes. The admin keeps its own folder cache,
 * and a change made on the server never passes through it, so without these the admin shows the old
 * state until a reload. Each carries the folder id only; the admin reads the folder back.
 *
 * `created` and `updated` go out when the FLP tasks finish, since folder reads report permissions
 * from the FLP records. `deleted` goes out right after the delete: nothing is read back.
 */
export const FOLDER_CREATED_WEBSOCKET_ACTION = "aco.folder.created";
export const FOLDER_UPDATED_WEBSOCKET_ACTION = "aco.folder.updated";
export const FOLDER_DELETED_WEBSOCKET_ACTION = "aco.folder.deleted";

export interface NotifyFolderChangeParams {
    id: string;
    /**
     * Whose open tabs to tell. Defaults to the current identity. The FLP tasks pass the identity
     * that made the change, because they run later, outside that request.
     */
    identityId?: string;
    change: "created" | "updated" | "deleted";
}

export interface INotifyFolderChangeUseCase {
    execute(params: NotifyFolderChangeParams): Promise<void>;
}

export const NotifyFolderChangeUseCase = createAbstraction<INotifyFolderChangeUseCase>(
    "Aco/NotifyFolderChangeUseCase"
);

export namespace NotifyFolderChangeUseCase {
    export type Interface = INotifyFolderChangeUseCase;
    export type Params = NotifyFolderChangeParams;
}
