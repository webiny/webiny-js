import { createAbstraction } from "@webiny/feature/api";
import type { IDeleteCmsModelTask, IStoreValue } from "~/features/DeleteModelTask/types.js";

export interface IDeleteModelOperations {
    listModelsBeingDeleted(): Promise<IStoreValue[]>;
    isModelBeingDeleted(modelId: string): Promise<boolean>;
    fullyDeleteModel(modelId: string): Promise<IDeleteCmsModelTask>;
    cancelFullyDeleteModel(modelId: string): Promise<IDeleteCmsModelTask>;
    getDeleteModelProgress(modelId: string): Promise<IDeleteCmsModelTask>;
}

export const DeleteModelOperations =
    createAbstraction<IDeleteModelOperations>("DeleteModelOperations");

export namespace DeleteModelOperations {
    export type Interface = IDeleteModelOperations;
}
