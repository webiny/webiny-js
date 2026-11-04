import { Abstraction } from "@webiny/di";

/**
 * Hands an event to the handler app from inside the running process, as if a platform had invoked
 * it: the app builds a fresh request container, matches the event to its event type, and runs that
 * type's handler chain. Resolves with what the handler returns.
 *
 * This is how a long-lived process does work that needs the per-request stack (tenant, CMS models,
 * use cases) outside any incoming request: a background task iteration, a scheduled action firing.
 * Lambda gets the same from a fresh invocation, so only transports without one register this.
 */
export interface IEventDispatcher {
    dispatch<TResult = unknown>(event: unknown): Promise<TResult>;
}

export const EventDispatcher = new Abstraction<IEventDispatcher>("EventDispatcher");

export namespace EventDispatcher {
    export type Interface = IEventDispatcher;
}
