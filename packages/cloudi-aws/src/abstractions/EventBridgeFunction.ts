import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import type { Abstraction } from "@webiny/di";
import { Abstraction as AbstractionClass } from "@webiny/di";
import type { NextFunction } from "../types.js";

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
     * If this handler cannot process the event, it should call next() to pass to the next handler
     */
    execute(event: EventBridgeEvent<TDetailType, TDetail>, next: NextFunction): Promise<EventBridgeResult>;
}

export const EventBridgeFunction = new AbstractionClass<IEventBridgeFunction>("EventBridgeFunction");

export namespace EventBridgeFunction {
    export type Interface<TDetailType extends string = string, TDetail = any> = IEventBridgeFunction<
        TDetailType,
        TDetail
    >;
    export type Result = EventBridgeResult;

    export function createImplementation<T extends IEventBridgeFunction>(config: {
        implementation: new (...args: any[]) => T;
        dependencies: Array<Abstraction<any>>;
    }) {
        return {
            abstraction: EventBridgeFunction,
            implementation: config.implementation,
            dependencies: config.dependencies
        };
    }
}

export type { EventBridgeEvent };

