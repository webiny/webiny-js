import type { SQSEvent, SQSRecord } from "@webiny/aws-sdk/types/index.js";
import { createAbstraction } from "./createAbstraction.js";

export interface SqsResult {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

/**
 * Abstraction for SQS event handlers
 */
export interface ISqsEventHandler {
    execute(event: SQSEvent): Promise<SqsResult>;
}

export const SqsEventHandler = createAbstraction<ISqsEventHandler>("SqsEventHandler");

export namespace SqsEventHandler {
    export type Interface = ISqsEventHandler;
    export type Result = SqsResult;
}

export type { SQSEvent, SQSRecord };

