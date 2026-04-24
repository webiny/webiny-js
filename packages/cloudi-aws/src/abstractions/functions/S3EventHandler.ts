import type { S3Event, S3EventRecord } from "@webiny/aws-sdk/types/index.js";
import type { Constructor, Dependencies } from "@webiny/di";
import { CloudHandler, type ICloudHandler } from "../CloudHandler.js";

export interface S3Result {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

export namespace S3EventHandler {
    export type Interface = ICloudHandler<S3Event, S3Result>;

    export function createImplementation<I extends Constructor<Interface>>(params: {
        implementation: I;
        dependencies: Dependencies<I>;
    }) {
        return CloudHandler.createImplementation(params as any);
    }
}

export type { S3Event, S3EventRecord };
