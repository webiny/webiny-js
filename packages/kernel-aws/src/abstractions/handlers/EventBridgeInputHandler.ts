import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import { Abstraction } from "@webiny/di";
import type { IInputHandler } from "@webiny/kernel-core";

export interface EventBridgeResult {
    success: boolean;
    message?: string;
}

export interface IEventBridgeInputHandler extends IInputHandler<
    EventBridgeEvent<string, any>,
    EventBridgeResult
> {}

export const EventBridgeInputHandler = new Abstraction<IEventBridgeInputHandler>(
    "EventBridgeInputHandler"
);

export namespace EventBridgeInputHandler {
    export type Interface<TDetailType extends string = string, TDetail = any> = IInputHandler<
        EventBridgeEvent<TDetailType, TDetail>,
        EventBridgeResult
    >;
}

export type { EventBridgeEvent };
