import { createAbstraction } from "@webiny/feature/api";
import type { StorageOperationsCmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IRemoveEntryParams {
    model: Pick<StorageOperationsCmsModel, "tenant" | "modelId">;
    entryId: string;
}

export interface IRemoveEntry {
    execute(params: IRemoveEntryParams): Promise<void>;
}

export const RemoveEntry = createAbstraction<IRemoveEntry>("Cms/Pg/Os/SyncWriter/RemoveEntry");

export namespace RemoveEntry {
    export type Interface = IRemoveEntry;
    export type Params = IRemoveEntryParams;
}
