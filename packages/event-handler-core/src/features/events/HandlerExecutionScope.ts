import { AsyncLocalStorage } from "node:async_hooks";

/**
 * One handler execution, as the scope sees it. `requestId` is the platform's id for the same work
 * (the AWS request id on Lambda); it is only known once the transport has bound, so it is filled in
 * after the execution's container is built.
 */
export interface HandlerExecutionFrame {
    readonly executionId: string;
    requestId?: string;
}

const storage = new AsyncLocalStorage<HandlerExecutionFrame>();

function describeFrame(frame: HandlerExecutionFrame): string {
    if (!frame.requestId || frame.requestId === frame.executionId) {
        return `"${frame.executionId}"`;
    }
    return `"${frame.executionId}" (request "${frame.requestId}")`;
}

export class StaleHandlerExecutionError extends Error {
    constructor(owner: HandlerExecutionFrame, current: HandlerExecutionFrame, service?: string) {
        const ownerDescription = describeFrame(owner);
        const currentDescription = describeFrame(current);
        const message = [
            `${service ?? "A service"} belongs to handler execution ${ownerDescription} but was used during handler execution ${currentDescription}.`,
            `Something kept it after its handler execution ended, so this one would have run with an earlier one's state.`,
            `The usual cause is a GraphQL resolver that reads a dependency injected into its schema factory's constructor:`,
            `declare the dependency in builder.addResolver({ dependencies }) instead.`
        ].join(" ");

        super(message);
        this.name = "StaleHandlerExecutionError";
    }
}

/**
 * Tracks which handler execution the current async code belongs to. A handler execution is one
 * `HandlerApp.handle()` call, whatever triggered it: an HTTP request, a stream batch, a background
 * task step. A background task execution therefore runs as several handler executions.
 *
 * `HandlerApp.handle()` generates the execution id and opens the scope before anything else, so
 * building the execution's container runs inside it too. A service scoped to the execution can then
 * check that it is used by the execution it was created for. A service kept past its execution (in a
 * cached GraphQL schema, in module scope) and used by a later one would otherwise act on the earlier
 * one's identity or tenant.
 */
export const HandlerExecutionScope = {
    run<T>(executionId: string, cb: () => T): T {
        const frame: HandlerExecutionFrame = { executionId };
        return storage.run(frame, cb);
    },

    getCurrent(): HandlerExecutionFrame | undefined {
        return storage.getStore();
    },

    /** Records the platform's request id on the current execution, for error messages. */
    setRequestId(requestId: string): void {
        const frame = storage.getStore();
        if (frame) {
            frame.requestId = requestId;
        }
    },

    /**
     * Throws `StaleHandlerExecutionError` when called during a handler execution other than
     * `owner`. Does nothing outside a handler execution scope, or for a service that doesn't know
     * its handler execution. `service`, when given, names the caller in the error message.
     */
    assertOwner(owner: HandlerExecutionFrame | undefined, service?: string): void {
        const current = storage.getStore();
        if (!owner || !current || owner.executionId === current.executionId) {
            return;
        }
        throw new StaleHandlerExecutionError(owner, current, service);
    }
};
