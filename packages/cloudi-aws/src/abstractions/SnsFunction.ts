import type { SNSEvent, SNSEventRecord } from "@webiny/aws-sdk/types/index.js";
import type { Abstraction } from "@webiny/di";
import { Abstraction as AbstractionClass } from "@webiny/di";
import type { NextFunction } from "../types.js";

export interface SnsResult {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

/**
 * Abstraction for SNS Lambda functions
 */
export interface ISnsFunction {
    /**
     * Handle the SNS event
     * If this handler cannot process the event, it should call next() to pass to the next handler
     */
    execute(event: SNSEvent, next: NextFunction): Promise<SnsResult>;
}

export const SnsFunction = new AbstractionClass<ISnsFunction>("SnsFunction");

export namespace SnsFunction {
    export type Interface = ISnsFunction;
    export type Result = SnsResult;

    export function createImplementation<T extends ISnsFunction>(config: {
        implementation: new (...args: any[]) => T;
        dependencies: Array<Abstraction<any>>;
    }) {
        return {
            abstraction: SnsFunction,
            implementation: config.implementation,
            dependencies: config.dependencies
        };
    }
}

export type { SNSEvent, SNSEventRecord };

