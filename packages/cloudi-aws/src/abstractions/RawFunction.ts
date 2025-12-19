import { createAbstraction } from "./createAbstraction.js";
import type { Abstraction } from "@webiny/di";

/**
 * Abstraction for raw/generic Lambda functions
 * Use this for custom event types or when you need full control
 */
export interface IRawFunction<TEvent = any, TResult = any> {
    /**
     * Handle the raw event
     */
    execute(event: TEvent): Promise<TResult>;
}

export const RawFunction = createAbstraction<IRawFunction>("RawFunction");

export namespace RawFunction {
    export type Interface<TEvent = any, TResult = any> = IRawFunction<TEvent, TResult>;

    export function createImplementation<T extends IRawFunction>(config: {
        implementation: new (...args: any[]) => T;
        dependencies: Array<Abstraction<any>>;
    }) {
        return {
            abstraction: RawFunction,
            implementation: config.implementation,
            dependencies: config.dependencies
        };
    }
}

