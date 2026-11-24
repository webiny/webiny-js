import type { S3Event, S3EventRecord } from "@webiny/aws-sdk/types/index.js";
import { Abstraction } from "@webiny/di";
import type { InputHandler } from "@webiny/kernel-core";

export interface IS3InputHandler extends InputHandler.Interface<S3Event, void> {}

export const S3InputHandler = new Abstraction<IS3InputHandler>("S3InputHandler");

export namespace S3InputHandler {
    export type Interface = IS3InputHandler;
}

export type { S3Event, S3EventRecord };
