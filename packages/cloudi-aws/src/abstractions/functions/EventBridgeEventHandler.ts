import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/event-handler";

export interface EventBridgeResult {
    success: boolean;
    message?: string;
}

export interface IEventBridgeEventHandler extends IEventHandler<
    EventBridgeEvent<string, any>,
    EventBridgeResult
> {}

export const EventBridgeEventHandler = new Abstraction<IEventBridgeEventHandler>(
    "EventBridgeEventHandler"
);

export namespace EventBridgeEventHandler {
    export type Interface<TDetailType extends string = string, TDetail = any> = IEventHandler<
        EventBridgeEvent<TDetailType, TDetail>,
        EventBridgeResult
    >;
}

export type { EventBridgeEvent };
