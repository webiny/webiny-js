import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import { createAbstraction } from "./createAbstraction.js";
import type { Abstraction } from "@webiny/di";

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

    /**
     * Detect if the event is an EventBridge event
     */
    export function canUse(event: any): event is EventBridgeEvent<string, any> {
        return event.source && event["detail-type"] && event.detail !== undefined;
    }

    export function createImplementation<T extends IEventBridgeFunction>(config: {
        implementation: new (...args: any[]) => T;
        dependencies: Array<Abstraction<any>>;
    }) {
        return {
            abstraction: EventBridgeFunction,
            implementation: config.implementation,
            dependencies: config.dependencies,
            canUse: EventBridgeFunction.canUse
        };
    }
}

export type { EventBridgeEvent };

