import { createAbstraction } from "@webiny/feature/api";

/**
 * Sent to the user's open admin tabs when the assistant changes an entry. The admin keeps its own
 * entry lists, and a change made on the server never passes through them, so without these the list
 * shows the old data until a reload. Each carries the model and entry ids only; the admin reads the
 * entry back, or drops it for `deleted`.
 */
export const ENTRY_CREATED_WEBSOCKET_ACTION = "cms.entry.created";
export const ENTRY_UPDATED_WEBSOCKET_ACTION = "cms.entry.updated";
export const ENTRY_DELETED_WEBSOCKET_ACTION = "cms.entry.deleted";

export interface NotifyEntryChangeParams {
    modelId: string;
    entryId: string;
    change: "created" | "updated" | "deleted";
}

export interface INotifyEntryChangeUseCase {
    execute(params: NotifyEntryChangeParams): Promise<void>;
}

export const NotifyEntryChangeUseCase = createAbstraction<INotifyEntryChangeUseCase>(
    "HeadlessCms/NotifyEntryChangeUseCase"
);

export namespace NotifyEntryChangeUseCase {
    export type Interface = INotifyEntryChangeUseCase;
    export type Params = NotifyEntryChangeParams;
}
