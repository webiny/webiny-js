import { createAbstraction } from "@webiny/feature/api";

/**
 * Sent to the user's open admin tabs when an AI tool changes a folder. The admin keeps its own folder
 * cache, and a change made on the server never passes through it, so without these the admin shows
 * the old state until a reload. Each carries the folder id only; the admin reads the folder back.
 */
export const FOLDER_CREATED_WEBSOCKET_ACTION = "aco.folder.created";
export const FOLDER_UPDATED_WEBSOCKET_ACTION = "aco.folder.updated";
export const FOLDER_DELETED_WEBSOCKET_ACTION = "aco.folder.deleted";

export interface NotifyFolderChangeParams {
    id: string;
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
