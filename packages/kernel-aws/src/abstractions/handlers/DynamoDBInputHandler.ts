import type { DynamoDBStreamEvent, DynamoDBRecord } from "@webiny/aws-sdk/types/index.js";
import { Abstraction } from "@webiny/di";
import type { InputHandler } from "@webiny/kernel-core";

export interface DynamoDBResult {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

export interface IDynamoDBInputHandler extends InputHandler.Interface<
    DynamoDBStreamEvent,
    DynamoDBResult
> {}

export const DynamoDBInputHandler = new Abstraction<IDynamoDBInputHandler>("DynamoDBInputHandler");

export namespace DynamoDBInputHandler {
    export type Interface = IDynamoDBInputHandler;
}

export type { DynamoDBStreamEvent, DynamoDBRecord };
