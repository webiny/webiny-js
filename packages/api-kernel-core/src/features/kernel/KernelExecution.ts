import { Abstraction } from "@webiny/di";

export interface IKernelExecution {
    /** Id of the kernel execution this container belongs to. */
    getId(): string;
    /** Name of the nested scope this container belongs to, or `undefined` for the execution's own container. */
    getScopeId(): string | undefined;
    /**
     * Throws `StaleKernelExecutionError` when this container's services must not be used from the
     * calling code: while a different kernel execution is running, or, for a nested scope's
     * container, outside that scope. `service`, when given, names the caller in the error message.
     */
    assertCurrent(service?: string): void;
    /**
     * Creates a nested scope of this kernel execution, for a child container (one tenant's scope).
     * Each call creates a new scope: keep the returned instance, and enter it again with `run()`.
     * Called on a nested scope, it creates a sibling scope of the same execution.
     */
    createNested(scopeId: string): INestedKernelExecution;
}

export interface INestedKernelExecution extends IKernelExecution {
    getScopeId(): string;
    /**
     * Runs `cb`, and everything it starts, inside this scope. Services of this scope's container
     * can be used there; services of other scopes throw. Services of the execution's own container
     * can be used from any of its scopes.
     */
    run<T>(cb: () => T): T;
}

/**
 * The kernel execution (one `Kernel.handle()` call) that a container belongs to. Services that
 * hold per-execution state inject it to check that they are not used by a later execution.
 *
 * A container nested in the execution's own one (a tenant's scope) registers a nested instance,
 * created with `createNested()`. Its services then also check that they are used inside that scope.
 */
export const KernelExecution = new Abstraction<IKernelExecution>("KernelExecution");

export namespace KernelExecution {
    export type Interface = IKernelExecution;
    export type Nested = INestedKernelExecution;
}
