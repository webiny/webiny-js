import { AsyncLocalStorage } from "node:async_hooks";

const storage = new AsyncLocalStorage<string>();

export class StaleHandlerExecutionError extends Error {
    constructor(service: string, ownerExecutionId: string, currentExecutionId: string) {
        super(
            [
                `${service} belongs to handler execution "${ownerExecutionId}" but was used during handler execution "${currentExecutionId}".`,
                `Something kept it after its handler execution ended, so this one would have run with an earlier one's state.`,
                `The usual cause is a GraphQL resolver that reads a dependency injected into its schema factory's constructor:`,
                `declare the dependency in builder.addResolver({ dependencies }) instead.`
            ].join(" ")
        );
        this.name = "StaleHandlerExecutionError";
    }
}

/**
 * Tracks which handler execution the current async code belongs to. A handler execution is one
 * `HandlerApp.handle()` call, whatever triggered it: an HTTP request, a stream batch, a background
 * task step. A background task execution therefore runs as several handler executions. The id is
 * the handler execution container's `RequestId`.
 *
 * `HandlerApp` runs every handler execution in its own scope, so a service scoped to it can check
 * that it is used by the handler execution it was created for. A service kept past its handler
 * execution (in a cached GraphQL schema, in module scope) and used by a later one would otherwise
 * act on the earlier one's identity or tenant.
 */
export const HandlerExecutionScope = {
    run<T>(executionId: string, cb: () => T): T {
        return storage.run(executionId, cb);
    },

    getExecutionId(): string | undefined {
        return storage.getStore();
    },

    /**
     * Throws `StaleHandlerExecutionError` when called during a handler execution other than
     * `ownerExecutionId`. Does nothing outside a handler execution scope, or for a service that
     * doesn't know its handler execution.
     */
    assertOwner(service: string, ownerExecutionId: string | undefined): void {
        const currentExecutionId = storage.getStore();
        if (!ownerExecutionId || !currentExecutionId || ownerExecutionId === currentExecutionId) {
            return;
        }
        throw new StaleHandlerExecutionError(service, ownerExecutionId, currentExecutionId);
    }
};
