import { Abstraction } from "@webiny/di";

export interface IKernelExecutionId {
    /** Id of the kernel execution the calling code runs in, or `undefined` outside any. */
    getId(): string | undefined;
}

/**
 * The id of the kernel execution that is running now, for services in the ROOT container. A root service
 * outlives every execution, so it can't inject `KernelExecution` (which belongs to one execution's
 * container); it asks this at the moment it needs the id instead. The logger does, to stamp each
 * line with the id of the execution that wrote it.
 *
 * Code in a request's container should inject `KernelExecution` instead. Its id is the execution
 * the container was built for, and `assertCurrent()` catches the service being used by a later
 * one. This one only says which execution is running at the moment of the call, and has no such
 * check.
 *
 * `RootContainerFactory` registers it in the root container before `config.root` runs.
 */
export const KernelExecutionId = new Abstraction<IKernelExecutionId>("KernelExecutionId");

export namespace KernelExecutionId {
    export type Interface = IKernelExecutionId;
}
