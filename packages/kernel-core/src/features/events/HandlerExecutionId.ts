import { Abstraction } from "@webiny/di";

export interface IHandlerExecutionId {
    /** Id of the handler execution the calling code runs in, or `undefined` outside any. */
    getId(): string | undefined;
}

/**
 * The id of the handler execution that is running now, for services in the ROOT container. A root service
 * outlives every execution, so it can't inject `HandlerExecution` (which belongs to one execution's
 * container); it asks this at the moment it needs the id instead. The logger does, to stamp each
 * line with the id of the execution that wrote it.
 *
 * Code in a request's container should inject `HandlerExecution` instead. Its id is the execution
 * the container was built for, and `assertCurrent()` catches the service being used by a later
 * one. This one only says which execution is running at the moment of the call, and has no such
 * check.
 *
 * `RootContainerFactory` registers it in the root container before `config.root` runs.
 */
export const HandlerExecutionId = new Abstraction<IHandlerExecutionId>("HandlerExecutionId");

export namespace HandlerExecutionId {
    export type Interface = IHandlerExecutionId;
}
