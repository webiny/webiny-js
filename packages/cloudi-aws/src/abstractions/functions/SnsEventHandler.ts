import type { SNSEvent, SNSEventRecord } from "@webiny/aws-sdk/types/index.js";
import { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/event-handler";

export interface SnsResult {
    success: boolean;
    processedRecords?: number;
    message?: string;
}

export interface ISnsEventHandler extends IEventHandler<SNSEvent, SnsResult> {}

export const SnsEventHandler = new Abstraction<ISnsEventHandler>("SnsEventHandler");

export namespace SnsEventHandler {
    export type Interface = ISnsEventHandler;
}

export type { SNSEvent, SNSEventRecord };
