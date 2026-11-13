import { createAbstraction } from "@webiny/feature/api";

/**
 * Tells the user's open admin tabs that the assistant changed an entry. The admin keeps its own entry
 * lists, and a change made on the server never passes through them, so without this the list shows
 * the old data until a reload. Goes out as a record-changed message; see `getEntryRecordType`.
 */
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
