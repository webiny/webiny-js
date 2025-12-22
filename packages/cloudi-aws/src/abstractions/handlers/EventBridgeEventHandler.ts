import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import { createAbstraction } from "../createAbstraction.js";

export interface EventBridgeResult {
    success: boolean;
    message?: string;
}

/**
 * Abstraction for EventBridge event handlers
 */
export interface IEventBridgeEventHandler<TDetailType extends string = string, TDetail = any> {
    execute(event: EventBridgeEvent<TDetailType, TDetail>): Promise<EventBridgeResult>;
}

export const EventBridgeEventHandler = createAbstraction<IEventBridgeEventHandler>("EventBridgeEventHandler");

export namespace EventBridgeEventHandler {
    export type Interface<TDetailType extends string = string, TDetail = any> = IEventBridgeEventHandler<
        TDetailType,
        TDetail
    >;
    export type Result = EventBridgeResult;
}

export type { EventBridgeEvent };

