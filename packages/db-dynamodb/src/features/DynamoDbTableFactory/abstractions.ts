import { createAbstraction } from "@webiny/feature/api";
import type { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/abstractions.js";

export interface IDynamoDbTableFactoryCreateParams {
    name: string;
    indexes?: Record<string, { partitionKey: string; sortKey?: string }>;
}

export interface IDynamoDbTableFactory {
    create(params: IDynamoDbTableFactoryCreateParams): DynamoDbDocumentClient.Interface;
}

export const DynamoDbTableFactory = createAbstraction<IDynamoDbTableFactory>(
    "Db/DynamoDB/DynamoDbTableFactory"
);

export namespace DynamoDbTableFactory {
    export type Interface = IDynamoDbTableFactory;
}
