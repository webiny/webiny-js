import { Abstraction } from "@webiny/di";

/** One kernel execution, as the scope sees it. `KernelExecutionRunner` creates its id. */
export interface ExecutionFrame {
    readonly executionId: string;
}

export interface IKernelExecutionScope {
    /** Runs `cb`, and everything it starts, as the kernel execution `executionId`. */
    run<T>(executionId: string, cb: () => T): T;
    /** The kernel execution the calling code belongs to, or `undefined` outside any. */
    getCurrent(): ExecutionFrame | undefined;
    /**
     * Throws `StaleKernelExecutionError` when called during a kernel execution other than
     * `owner`. Does nothing outside a kernel execution scope, or for a service that doesn't know
     * its kernel execution. `service`, when given, names the caller in the error message.
     */
    assertOwner(owner: ExecutionFrame | undefined, service?: string): void;
}

/**
 * Tracks which kernel execution the current async code belongs to. A kernel execution is one
 * `Kernel.handle()` call, whatever triggered it: an HTTP request, a stream batch, a background
 * task step. A background task execution therefore runs as several kernel executions.
 *
 * `Kernel.init()` registers one in its app container, so every execution of that app shares
 * it. `Kernel.handle()` generates the execution id and opens the scope before anything else, so
 * building the execution's container runs inside it too. A service scoped to the execution can then
 * check that it is used by the execution it was created for. A service kept past its execution (in a
 * cached GraphQL schema, in module scope) and used by a later one would otherwise act on the earlier
 * one's identity or tenant.
 *
 * Services don't use this directly: they inject `KernelExecution`.
 */
export const KernelExecutionScope = new Abstraction<IKernelExecutionScope>("KernelExecutionScope");

export namespace KernelExecutionScope {
    export type Interface = IKernelExecutionScope;
    export type Frame = ExecutionFrame;
}
