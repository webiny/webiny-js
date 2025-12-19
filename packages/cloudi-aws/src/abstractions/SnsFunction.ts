import type { SNSEvent, SNSEventRecord } from "@webiny/aws-sdk/types/index.js";
import { createAbstraction } from "./createAbstraction.js";
import type { Abstraction } from "@webiny/di";

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
     */
    execute(event: SNSEvent): Promise<SnsResult>;
}

export const SnsFunction = createAbstraction<ISnsFunction>("SnsFunction");

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

