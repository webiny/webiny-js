import { Abstraction } from "@webiny/di";

/** One handler execution, as the scope sees it. `HandlerExecutionRunner` creates its id. */
export interface HandlerExecutionFrame {
    readonly executionId: string;
}

export interface IHandlerExecutionScope {
    /** Runs `cb`, and everything it starts, as the handler execution `executionId`. */
    run<T>(executionId: string, cb: () => T): T;
    /** The handler execution the calling code belongs to, or `undefined` outside any. */
    getCurrent(): HandlerExecutionFrame | undefined;
    /**
     * Throws `StaleHandlerExecutionError` when called during a handler execution other than
     * `owner`. Does nothing outside a handler execution scope, or for a service that doesn't know
     * its handler execution. `service`, when given, names the caller in the error message.
     */
    assertOwner(owner: HandlerExecutionFrame | undefined, service?: string): void;
}

/**
 * Tracks which handler execution the current async code belongs to. A handler execution is one
 * `HandlerApp.handle()` call, whatever triggered it: an HTTP request, a stream batch, a background
 * task step. A background task execution therefore runs as several handler executions.
 *
 * `HandlerApp.init()` registers one in its app container, so every execution of that app shares
 * it. `HandlerApp.handle()` generates the execution id and opens the scope before anything else, so
 * building the execution's container runs inside it too. A service scoped to the execution can then
 * check that it is used by the execution it was created for. A service kept past its execution (in a
 * cached GraphQL schema, in module scope) and used by a later one would otherwise act on the earlier
 * one's identity or tenant.
 *
 * Services don't use this directly: they inject `HandlerExecution`.
 */
export const HandlerExecutionScope = new Abstraction<IHandlerExecutionScope>(
    "HandlerExecutionScope"
);

export namespace HandlerExecutionScope {
    export type Interface = IHandlerExecutionScope;
    export type Frame = HandlerExecutionFrame;
}
