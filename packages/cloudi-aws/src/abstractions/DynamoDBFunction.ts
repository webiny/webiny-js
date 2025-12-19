import type { DynamoDBStreamEvent, DynamoDBRecord } from "@webiny/aws-sdk/types/index.js";
import { createAbstraction } from "./createAbstraction.js";
import type { Abstraction } from "@webiny/di";

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
     */
    execute(event: DynamoDBStreamEvent): Promise<DynamoDBResult>;
}

export const DynamoDBFunction = createAbstraction<IDynamoDBFunction>("DynamoDBFunction");

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

