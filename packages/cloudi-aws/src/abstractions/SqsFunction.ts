import type { SQSEvent, SQSRecord } from "@webiny/aws-sdk/types/index.js";
import type { Abstraction } from "@webiny/di";
import { Abstraction as AbstractionClass } from "@webiny/di";
import type { NextFunction } from "../types.js";

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
     * If this handler cannot process the event, it should call next() to pass to the next handler
     */
    execute(event: SQSEvent, next: NextFunction): Promise<SqsResult>;
}

export const SqsFunction = new AbstractionClass<ISqsFunction>("SqsFunction");

export namespace SqsFunction {
    export type Interface = ISqsFunction;
    export type Result = SqsResult;

    export function createImplementation<T extends ISqsFunction>(config: {
        implementation: new (...args: any[]) => T;
        dependencies: Array<Abstraction<any>>;
    }) {
        return {
            abstraction: SqsFunction,
            implementation: config.implementation,
            dependencies: config.dependencies
        };
    }
}

export type { SQSEvent, SQSRecord };

