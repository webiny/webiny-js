import { Abstraction } from "@webiny/di";

export interface IHandlerExecution {
    /** Id of the handler execution this container belongs to. */
    getId(): string;
    /**
     * Throws `StaleHandlerExecutionError` when called while a different handler execution is
     * running. `service`, when given, names the caller in the error message.
     */
    assertCurrent(service?: string): void;
}

/**
 * The handler execution (one `HandlerApp.handle()` call) that a container belongs to. Services that
 * hold per-execution state inject it to check that they are not used by a later execution.
 */
export const HandlerExecution = new Abstraction<IHandlerExecution>("HandlerExecution");

export namespace HandlerExecution {
    export type Interface = IHandlerExecution;
}
