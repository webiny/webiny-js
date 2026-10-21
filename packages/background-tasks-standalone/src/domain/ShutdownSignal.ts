import { createAbstraction } from "@webiny/feature/api";

/**
 * Tells the task code that this process is stopping, so it hands its work back instead of starting
 * more. One for the whole process: the loop, the iterations and recovery all listen to the same one.
 */
export interface IShutdownSignal {
    isStopping(): boolean;
    /** Calls `listener` once the process starts stopping. Returns a function that unsubscribes. */
    onStop(listener: () => void): () => void;
    /** Starts stopping. Calling it again does nothing. */
    stop(): void;
}

export const ShutdownSignal = createAbstraction<IShutdownSignal>("BackgroundTasks/ShutdownSignal");

export namespace ShutdownSignal {
    export type Interface = IShutdownSignal;
}
