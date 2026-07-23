import { createAbstraction } from "@webiny/feature/api";
import type { StorageOperationsCmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IRemovePublishedParams {
    model: Pick<StorageOperationsCmsModel, "tenant" | "modelId">;
    entryId: string;
}

export interface IRemovePublished {
    execute(params: IRemovePublishedParams): Promise<void>;
}

export const RemovePublished = createAbstraction<IRemovePublished>(
    "Cms/Pg/Os/SyncWriter/RemovePublished"
);

export namespace RemovePublished {
    export type Interface = IRemovePublished;
    export type Params = IRemovePublishedParams;
}
