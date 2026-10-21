import { createAbstraction } from "@webiny/feature/api";

/**
 * Names this process as the owner of the tasks it claims. Unique per process start, so a restarted
 * process on the same host does not mistake its predecessor's claims for its own.
 */
export interface IProcessOwner {
    readonly id: string;
}

export const ProcessOwner = createAbstraction<IProcessOwner>("BackgroundTasks/ProcessOwner");

export namespace ProcessOwner {
    export type Interface = IProcessOwner;
}
