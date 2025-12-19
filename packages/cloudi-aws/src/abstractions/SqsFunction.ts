import type { SQSEvent, SQSRecord } from "@webiny/aws-sdk/types/index.js";
import { createAbstraction } from "./createAbstraction.js";
import type { Abstraction } from "@webiny/di";

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

    /**
     * Detect if the event is an SQS event
     */
    export function canUse(event: any): event is SQSEvent {
        return Array.isArray(event.Records) && event.Records[0]?.eventSource === "aws:sqs";
    }

    export function createImplementation<T extends ISqsFunction>(config: {
        implementation: new (...args: any[]) => T;
        dependencies: Array<Abstraction<any>>;
    }) {
        return {
            abstraction: SqsFunction,
            implementation: config.implementation,
            dependencies: config.dependencies,
            canUse: SqsFunction.canUse
        };
    }
}

export type { SQSEvent, SQSRecord };

