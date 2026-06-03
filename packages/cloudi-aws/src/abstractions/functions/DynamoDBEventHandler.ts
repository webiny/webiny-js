import type { DynamoDBStreamEvent, DynamoDBRecord } from "@webiny/aws-sdk/types/index.js";
import type { Constructor, Dependencies } from "@webiny/di";
import { CloudHandler } from "@cloudi/core";
import type { ICloudHandler } from "@cloudi/core";

export interface DynamoDBResult {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

export namespace DynamoDBEventHandler {
    export type Interface = ICloudHandler<DynamoDBStreamEvent, DynamoDBResult>;

    export function createImplementation<I extends Constructor<Interface>>(params: {
        implementation: I;
        dependencies: Dependencies<I>;
    }) {
        return CloudHandler.createImplementation(params as any);
    }
}

export type { DynamoDBStreamEvent, DynamoDBRecord };
