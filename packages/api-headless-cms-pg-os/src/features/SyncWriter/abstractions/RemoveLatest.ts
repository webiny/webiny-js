import { createAbstraction } from "@webiny/feature/api";
import type { StorageOperationsCmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IRemoveLatestParams {
    model: Pick<StorageOperationsCmsModel, "tenant" | "modelId">;
    entryId: string;
}

export interface IRemoveLatest {
    execute(params: IRemoveLatestParams): Promise<void>;
}

export const RemoveLatest = createAbstraction<IRemoveLatest>("Cms/Pg/Os/SyncWriter/RemoveLatest");

export namespace RemoveLatest {
    export type Interface = IRemoveLatest;
    export type Params = IRemoveLatestParams;
}
