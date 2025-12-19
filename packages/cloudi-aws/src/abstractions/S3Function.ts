import type { S3Event, S3EventRecord } from "@webiny/aws-sdk/types/index.js";
import { createAbstraction } from "./createAbstraction.js";
import type { Abstraction } from "@webiny/di";

export interface S3Result {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

/**
 * Abstraction for S3 Lambda functions
 */
export interface IS3Function {
    /**
     * Handle the S3 event
     */
    execute(event: S3Event): Promise<S3Result>;
}

export const S3Function = createAbstraction<IS3Function>("S3Function");

export namespace S3Function {
    export type Interface = IS3Function;
    export type Result = S3Result;

    export function createImplementation<T extends IS3Function>(config: {
        implementation: new (...args: any[]) => T;
        dependencies: Array<Abstraction<any>>;
    }) {
        return {
            abstraction: S3Function,
            implementation: config.implementation,
            dependencies: config.dependencies
        };
    }
}

export type { S3Event, S3EventRecord };

