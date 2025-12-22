import type { DynamoDBStreamEvent, DynamoDBRecord } from "@webiny/aws-sdk/types/index.js";
import type { Abstraction } from "@webiny/di";
import { Abstraction as AbstractionClass } from "@webiny/di";
import type { NextFunction } from "../types.js";

export interface DynamoDBResult {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

/**
 * Abstraction for DynamoDB Stream Lambda functions
 */
export interface IDynamoDBFunction {
    /**
     * Handle the DynamoDB Stream event
     * If this handler cannot process the event, it should call next() to pass to the next handler
     */
    execute(event: DynamoDBStreamEvent, next: NextFunction): Promise<DynamoDBResult>;
}

export const DynamoDBFunction = new AbstractionClass<IDynamoDBFunction>("DynamoDBFunction");

export namespace DynamoDBFunction {
    export type Interface = IDynamoDBFunction;
    export type Result = DynamoDBResult;

    export function createImplementation<T extends IDynamoDBFunction>(config: {
        implementation: new (...args: any[]) => T;
        dependencies: Array<Abstraction<any>>;
    }) {
        return {
            abstraction: DynamoDBFunction,
            implementation: config.implementation,
            dependencies: config.dependencies
        };
    }
}

export type { DynamoDBStreamEvent, DynamoDBRecord };

