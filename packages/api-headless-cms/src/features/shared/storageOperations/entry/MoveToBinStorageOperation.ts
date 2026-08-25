import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel, CmsEntryStorageOperationsMoveToBinParams } from "~/types/index.js";

export interface IMoveToBinStorageOperation {
    execute(model: CmsModel, params: CmsEntryStorageOperationsMoveToBinParams): Promise<void>;
}

export const MoveToBinStorageOperation = createAbstraction<IMoveToBinStorageOperation>(
    "Cms/Entry/MoveToBinStorageOperation"
);

export namespace MoveToBinStorageOperation {
    export type Interface = IMoveToBinStorageOperation;
}
