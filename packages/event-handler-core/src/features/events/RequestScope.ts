import { AsyncLocalStorage } from "node:async_hooks";

const storage = new AsyncLocalStorage<string>();

export class StaleRequestScopeError extends Error {
    constructor(service: string, ownerRequestId: string, currentRequestId: string) {
        super(
            [
                `${service} belongs to request "${ownerRequestId}" but was used while handling request "${currentRequestId}".`,
                `Something kept it after its request ended, so this request would have run with another request's state.`,
                `The usual cause is a GraphQL resolver that reads a dependency injected into its schema factory's constructor:`,
                `declare the dependency in builder.addResolver({ dependencies }) instead.`
            ].join(" ")
        );
        this.name = "StaleRequestScopeError";
    }
}

/**
 * Tracks which request the current async execution belongs to. `HandlerApp` runs every request in
 * its own scope, so a request-scoped service can check that it is used by the request it was
 * created for. A service kept past its request (in a cached GraphQL schema, in module scope) and
 * used by a later request would otherwise act on that earlier request's identity or tenant.
 */
export const RequestScope = {
    run<T>(requestId: string, cb: () => T): T {
        return storage.run(requestId, cb);
    },

    getRequestId(): string | undefined {
        return storage.getStore();
    },

    /**
     * Throws `StaleRequestScopeError` when called during a request other than `ownerRequestId`.
     * Does nothing outside a request scope, or for a service that doesn't know its request.
     */
    assertOwner(service: string, ownerRequestId: string | undefined): void {
        const currentRequestId = storage.getStore();
        if (!ownerRequestId || !currentRequestId || ownerRequestId === currentRequestId) {
            return;
        }
        throw new StaleRequestScopeError(service, ownerRequestId, currentRequestId);
    }
};
