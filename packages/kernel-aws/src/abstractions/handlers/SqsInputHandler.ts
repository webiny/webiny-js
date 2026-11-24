import type { SQSEvent, SQSRecord } from "@webiny/aws-sdk/types/index.js";
import { Abstraction } from "@webiny/di";
import type { IInputHandler } from "@webiny/kernel-core";

export interface SqsResult {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

export interface ISqsInputHandler extends IInputHandler<SQSEvent, SqsResult> {}

export const SqsInputHandler = new Abstraction<ISqsInputHandler>("SqsInputHandler");

export namespace SqsInputHandler {
    export type Interface = ISqsInputHandler;
}

export type { SQSEvent, SQSRecord };
