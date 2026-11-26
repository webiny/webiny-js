import { Abstraction } from "@webiny/di";

/** One kernel execution, as the scope sees it. `KernelExecutionRunner` creates its id. */
export interface ExecutionFrame {
    readonly executionId: string;
}

/**
 * A scope inside one kernel execution, such as a tenant's scope. Its owner creates it once and
 * keeps it, so entering the same scope again runs in the same frame. Services built for the scope
 * hold this frame, and the guard compares against it by identity.
 */
export interface NestedExecutionFrame extends ExecutionFrame {
    /** Names the scope in error messages. Not compared: two frames with the same id are different scopes. */
    readonly scopeId: string;
    /** The execution the scope belongs to. */
    readonly execution: ExecutionFrame;
}

export interface IKernelExecutionScope {
    /** Runs `cb`, and everything it starts, as the kernel execution `executionId`. */
    run<T>(executionId: string, cb: () => T): T;
    /**
     * Runs `cb`, and everything it starts, inside the nested frame `frame`. Throws
     * `StaleKernelExecutionError` when called during a kernel execution other than the frame's.
     */
    runNested<T>(frame: NestedExecutionFrame, cb: () => T): T;
    /**
     * The kernel execution the calling code belongs to, or `undefined` outside any. Inside a
     * nested frame, this is still the execution's frame.
     */
    getCurrent(): ExecutionFrame | undefined;
    /** The nested frame the calling code runs in, or `undefined` when it runs in none. */
    getCurrentNested(): NestedExecutionFrame | undefined;
    /**
     * Throws `StaleKernelExecutionError` when `owner` is not usable from the calling code:
     * - `owner` is an execution frame, and a different kernel execution is running;
     * - `owner` is a nested frame, and the calling code runs in another nested frame, in none, or
     *   in a different kernel execution.
     * Does nothing outside a kernel execution scope, or for a service that doesn't know its
     * kernel execution. `service`, when given, names the caller in the error message.
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
 * Within one execution, code can also run in nested frames (one per tenant scope). A service built
 * in the execution's own container can be used from any of them. A service built for a nested
 * frame can be used only inside that frame: used anywhere else, it would act on another scope's
 * state.
 *
 * Services don't use this directly: they inject `KernelExecution`.
 */
export const KernelExecutionScope = new Abstraction<IKernelExecutionScope>("KernelExecutionScope");

export namespace KernelExecutionScope {
    export type Interface = IKernelExecutionScope;
    export type Frame = ExecutionFrame;
    export type NestedFrame = NestedExecutionFrame;
}

/** Whether `frame` is a nested frame rather than an execution's own frame. */
export function isNestedFrame(frame: ExecutionFrame): frame is NestedExecutionFrame {
    return "execution" in frame;
}

/** The execution frame `frame` belongs to: itself, or the execution of a nested frame. */
export function getExecutionFrame(frame: ExecutionFrame): ExecutionFrame {
    return isNestedFrame(frame) ? frame.execution : frame;
}
