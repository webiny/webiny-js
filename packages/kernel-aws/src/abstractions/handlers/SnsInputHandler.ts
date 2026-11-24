import type { SNSEvent, SNSEventRecord } from "@webiny/aws-sdk/types/index.js";
import { Abstraction } from "@webiny/di";
import type { IInputHandler } from "@webiny/kernel-core";

export interface SnsResult {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

export interface ISnsInputHandler extends IInputHandler<SNSEvent, SnsResult> {}

export const SnsInputHandler = new Abstraction<ISnsInputHandler>("SnsInputHandler");

export namespace SnsInputHandler {
    export type Interface = ISnsInputHandler;
}

export type { SNSEvent, SNSEventRecord };
