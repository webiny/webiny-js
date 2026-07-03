import type { SQSEvent, SQSRecord } from "@webiny/aws-sdk/types/index.js";
import { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/event-handler-core";

export interface SqsResult {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

export interface ISqsEventHandler extends IEventHandler<SQSEvent, SqsResult> {}

export const SqsEventHandler = new Abstraction<ISqsEventHandler>("SqsEventHandler");

export namespace SqsEventHandler {
    export type Interface = ISqsEventHandler;
}

export type { SQSEvent, SQSRecord };
