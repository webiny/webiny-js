import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import { createAbstraction } from "./createAbstraction.js";

export interface EventBridgeResult {
    success: boolean;
    message?: string;
}

/**
 * Abstraction for EventBridge Lambda functions
 */
export interface IEventBridgeFunction<TDetailType extends string = string, TDetail = any> {
    /**
     * Handle the EventBridge event
     */
    execute(event: EventBridgeEvent<TDetailType, TDetail>): Promise<EventBridgeResult>;
}

export const EventBridgeFunction = createAbstraction<IEventBridgeFunction>("EventBridgeFunction");

export namespace EventBridgeFunction {
    export type Interface<TDetailType extends string = string, TDetail = any> = IEventBridgeFunction<
        TDetailType,
        TDetail
    >;
    export type Result = EventBridgeResult;
}

export type { EventBridgeEvent };

