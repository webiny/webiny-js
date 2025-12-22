import { createAbstraction } from "./createAbstraction.js";
import type { NextFunction } from "../types.js";

/**
 * Abstraction for raw/generic Lambda functions
 * Use this for custom event types or when you need full control
 */
export interface IRawFunction<TEvent = any, TResult = any> {
    /**
     * Handle the raw event
     * If this handler cannot process the event, it should call next() to pass to the next handler
     */
    execute(event: TEvent, next: NextFunction): Promise<TResult>;
}

export const RawFunction = createAbstraction<IRawFunction>("RawFunction");

export namespace RawFunction {
    export type Interface<TEvent = any, TResult = any> = IRawFunction<TEvent, TResult>;
}

