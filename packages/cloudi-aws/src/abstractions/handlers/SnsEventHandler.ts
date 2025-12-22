import type { SNSEvent, SNSEventRecord } from "@webiny/aws-sdk/types/index.js";
import { createAbstraction } from "../createAbstraction.js";

export interface SnsResult {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

/**
 * Abstraction for SNS event handlers
 */
export interface ISnsEventHandler {
    /**
     * Handle the SNS event
     */
    execute(event: SNSEvent): Promise<SnsResult>;
}

export const SnsEventHandler = createAbstraction<ISnsEventHandler>("SnsEventHandler");

export namespace SnsEventHandler {
    export type Interface = ISnsEventHandler;
    export type Result = SnsResult;
}

export type { SNSEvent, SNSEventRecord };

