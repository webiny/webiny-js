import { createAbstraction } from "@webiny/feature/api";

/**
 * Tells the task code that this process is shutting down, so it hands its work back instead of
 * starting more. One for the whole process: the loop, the iterations and recovery all listen to the
 * same one.
 */
export interface IShutdownSignal {
    isShuttingDown(): boolean;
    /** Calls `listener` once the shutdown begins. Returns a function that unsubscribes. */
    onShutdown(listener: () => void): () => void;
    /** Begins the shutdown. Calling it again does nothing. */
    begin(): void;
}

export const ShutdownSignal = createAbstraction<IShutdownSignal>("BackgroundTasks/ShutdownSignal");

export namespace ShutdownSignal {
    export type Interface = IShutdownSignal;
}
