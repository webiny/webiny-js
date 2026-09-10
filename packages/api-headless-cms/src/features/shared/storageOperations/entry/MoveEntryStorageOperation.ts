import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "~/types/index.js";

export interface IMoveEntryStorageOperation {
    execute(model: CmsModel, id: string, folderId: string): Promise<void>;
}

export const MoveEntryStorageOperation = createAbstraction<IMoveEntryStorageOperation>(
    "Cms/Entry/MoveEntryStorageOperation"
);

export namespace MoveEntryStorageOperation {
    export type Interface = IMoveEntryStorageOperation;
}
