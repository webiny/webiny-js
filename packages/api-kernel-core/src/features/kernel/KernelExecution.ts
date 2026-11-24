import { Abstraction } from "@webiny/di";

export interface IKernelExecution {
    /** Id of the kernel execution this container belongs to. */
    getId(): string;
    /**
     * Throws `StaleKernelExecutionError` when called while a different kernel execution is
     * running. `service`, when given, names the caller in the error message.
     */
    assertCurrent(service?: string): void;
}

/**
 * The kernel execution (one `Kernel.handle()` call) that a container belongs to. Services that
 * hold per-execution state inject it to check that they are not used by a later execution.
 */
export const KernelExecution = new Abstraction<IKernelExecution>("KernelExecution");

export namespace KernelExecution {
    export type Interface = IKernelExecution;
}
