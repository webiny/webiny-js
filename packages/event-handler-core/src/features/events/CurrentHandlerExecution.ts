import { Abstraction } from "@webiny/di";

export interface ICurrentHandlerExecution {
    /** Id of the handler execution the calling code runs in, or `undefined` outside any. */
    getId(): string | undefined;
}

/**
 * The handler execution that is running now, for services in the ROOT container. A root service
 * outlives every execution, so it can't inject `HandlerExecution` (which belongs to one execution's
 * container); it asks this at the moment it needs the id instead. The logger does, to stamp each
 * line with the id of the execution that wrote it.
 *
 * `RootContainerFactory` registers it in the root container before `config.root` runs.
 */
export const CurrentHandlerExecution = new Abstraction<ICurrentHandlerExecution>(
    "CurrentHandlerExecution"
);

export namespace CurrentHandlerExecution {
    export type Interface = ICurrentHandlerExecution;
}
