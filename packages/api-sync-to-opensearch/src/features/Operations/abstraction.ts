import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IInsertOperationParams {
    id: string;
    index: string;
    data: GenericRecord;
}

export type IModifyOperationParams = IInsertOperationParams;

export interface IDeleteOperationParams {
    id: string;
    index: string;
}

export interface IOperations {
    items: GenericRecord[];
    total: number;
    count: number;
    clear(): void;
    insert(params: IInsertOperationParams): void;
    modify(params: IModifyOperationParams): void;
    delete(params: IDeleteOperationParams): void;
}

export const Operations = createAbstraction<IOperations>("Sync/Operations");

export namespace Operations {
    export type Interface = IOperations;
}
