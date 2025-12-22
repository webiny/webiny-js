import type { S3Event, S3EventRecord } from "@webiny/aws-sdk/types/index.js";
import { createAbstraction } from "./createAbstraction.js";

export interface S3Result {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

/**
 * Abstraction for S3 event handlers
 */
export interface IS3EventHandler {
    execute(event: S3Event): Promise<S3Result>;
}

export const S3EventHandler = createAbstraction<IS3EventHandler>("S3EventHandler");

export namespace S3EventHandler {
    export type Interface = IS3EventHandler;
    export type Result = S3Result;
}

export type { S3Event, S3EventRecord };

