import { createAbstraction } from "./createAbstraction.js";

/**
 * Abstraction for raw/generic event handlers
 * Use this for custom event types or when you need full control
 */
export interface IRawEventHandler<TEvent = any, TResult = any> {
    execute(event: TEvent): Promise<TResult>;
}

export const RawEventHandler = createAbstraction<IRawEventHandler>("RawEventHandler");

export namespace RawEventHandler {
    export type Interface<TEvent = any, TResult = any> = IRawEventHandler<TEvent, TResult>;
}

