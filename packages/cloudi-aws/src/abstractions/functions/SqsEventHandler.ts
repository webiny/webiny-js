import type { SQSEvent, SQSRecord } from "@webiny/aws-sdk/types/index.js";
import type { Constructor, Dependencies } from "@webiny/di";
import { CloudHandler, type ICloudHandler } from "../CloudHandler.js";

export interface SqsResult {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

export namespace SqsEventHandler {
    export type Interface = ICloudHandler<SQSEvent, SqsResult>;

    export function createImplementation<I extends Constructor<Interface>>(params: {
        implementation: I;
        dependencies: Dependencies<I>;
    }) {
        return CloudHandler.createImplementation(params as any);
    }
}

export type { SQSEvent, SQSRecord };
