import type { DynamoDBStreamEvent, DynamoDBRecord } from "@webiny/aws-sdk/types/index.js";
import { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/event-handler";

export interface DynamoDBResult {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

export interface IDynamoDBEventHandler extends IEventHandler<DynamoDBStreamEvent, DynamoDBResult> {}

export const DynamoDBEventHandler = new Abstraction<IDynamoDBEventHandler>("DynamoDBEventHandler");

export namespace DynamoDBEventHandler {
    export type Interface = IDynamoDBEventHandler;
}

export type { DynamoDBStreamEvent, DynamoDBRecord };
