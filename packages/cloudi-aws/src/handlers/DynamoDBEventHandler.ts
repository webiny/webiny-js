import type { DynamoDBStreamEvent, DynamoDBRecord } from "@webiny/aws-sdk/types/index.js";
import { createAbstraction } from "../abstractions/createAbstraction.js";

export interface DynamoDBResult {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

/**
 * Abstraction for DynamoDB Stream event handlers
 */
export interface IDynamoDBEventHandler {
    execute(event: DynamoDBStreamEvent): Promise<DynamoDBResult>;
}

export const DynamoDBEventHandler = createAbstraction<IDynamoDBEventHandler>("DynamoDBEventHandler");

export namespace DynamoDBEventHandler {
    export type Interface = IDynamoDBEventHandler;
    export type Result = DynamoDBResult;
}

export type { DynamoDBStreamEvent, DynamoDBRecord };

