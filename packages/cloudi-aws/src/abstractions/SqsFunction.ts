import type { SQSEvent, SQSRecord } from "@webiny/aws-sdk/types/index.js";
import { createAbstraction } from "./createAbstraction.js";

export interface SqsResult {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

/**
 * Abstraction for SQS Lambda functions
 */
export interface ISqsFunction {
    /**
     * Handle the SQS event
     */
    execute(event: SQSEvent): Promise<SqsResult>;
}

export const SqsFunction = createAbstraction<ISqsFunction>("SqsFunction");

export namespace SqsFunction {
    export type Interface = ISqsFunction;
    export type Result = SqsResult;
}

export type { SQSEvent, SQSRecord };

