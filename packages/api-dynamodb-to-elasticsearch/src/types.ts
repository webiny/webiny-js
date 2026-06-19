import type { GenericRecord } from "@webiny/api/types.js";
import type { DynamoDBRecord } from "@webiny/aws-sdk/types/index.js";

export interface IOperationsBuilderBuildParams {
    records: DynamoDBRecord[];
}

export interface IOperationsBuilder {
    build(params: IOperationsBuilderBuildParams): Promise<IOperations>;
}

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
    clear(): void;
    insert(params: IInsertOperationParams): void;
    modify(params: IModifyOperationParams): void;
    delete(params: IDeleteOperationParams): void;
}
