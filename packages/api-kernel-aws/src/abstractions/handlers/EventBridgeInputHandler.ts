import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import { Abstraction } from "@webiny/di";
import type { InputHandler } from "@webiny/api-kernel-core";

export interface EventBridgeResult {
    success: boolean;
    message?: string;
}

export interface IEventBridgeInputHandler extends InputHandler.Interface<
    EventBridgeEvent<string, any>,
    EventBridgeResult
> {}

export const EventBridgeInputHandler = new Abstraction<IEventBridgeInputHandler>(
    "EventBridgeInputHandler"
);

export namespace EventBridgeInputHandler {
    export type Interface<
        TDetailType extends string = string,
        TDetail = any
    > = InputHandler.Interface<EventBridgeEvent<TDetailType, TDetail>, EventBridgeResult>;
}

export type { EventBridgeEvent };
