import type { S3Event, S3EventRecord } from "@webiny/aws-sdk/types/index.js";
import { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/event-handler";

export interface IS3EventHandler extends IEventHandler<S3Event, void> {}

export const S3EventHandler = new Abstraction<IS3EventHandler>("S3EventHandler");

export namespace S3EventHandler {
    export type Interface = IS3EventHandler;
}

export type { S3Event, S3EventRecord };
