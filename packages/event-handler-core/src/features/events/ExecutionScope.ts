import { AsyncLocalStorage } from "node:async_hooks";

const storage = new AsyncLocalStorage<string>();

export class StaleExecutionScopeError extends Error {
    constructor(service: string, ownerExecutionId: string, currentExecutionId: string) {
        super(
            [
                `${service} belongs to execution "${ownerExecutionId}" but was used during execution "${currentExecutionId}".`,
                `Something kept it after its execution ended, so this execution would have run with another execution's state.`,
                `The usual cause is a GraphQL resolver that reads a dependency injected into its schema factory's constructor:`,
                `declare the dependency in builder.addResolver({ dependencies }) instead.`
            ].join(" ")
        );
        this.name = "StaleExecutionScopeError";
    }
}

/**
 * Tracks which execution the current async code belongs to. An execution is one unit of work:
 * one `HandlerApp.handle()` call, whatever triggered it (an HTTP request, a stream batch, a
 * background task step). Its id is the execution container's `RequestId`.
 *
 * `HandlerApp` runs every execution in its own scope, so an execution-scoped service can check that
 * it is used by the execution it was created for. A service kept past its execution (in a cached
 * GraphQL schema, in module scope) and used by a later one would otherwise act on the earlier
 * execution's identity or tenant.
 */
export const ExecutionScope = {
    run<T>(executionId: string, cb: () => T): T {
        return storage.run(executionId, cb);
    },

    getExecutionId(): string | undefined {
        return storage.getStore();
    },

    /**
     * Throws `StaleExecutionScopeError` when called during an execution other than
     * `ownerExecutionId`. Does nothing outside an execution scope, or for a service that doesn't
     * know its execution.
     */
    assertOwner(service: string, ownerExecutionId: string | undefined): void {
        const currentExecutionId = storage.getStore();
        if (!ownerExecutionId || !currentExecutionId || ownerExecutionId === currentExecutionId) {
            return;
        }
        throw new StaleExecutionScopeError(service, ownerExecutionId, currentExecutionId);
    }
};
