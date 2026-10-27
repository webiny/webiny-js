import { createAbstraction } from "@webiny/feature/api";

/**
 * Names this process in what it writes to shared storage: the tasks it claims, the websocket
 * connections it holds. Unique per process start, so a restarted process on the same host does not
 * mistake its predecessor's records for its own.
 */
export interface IProcessOwner {
    readonly id: string;
}

export const ProcessOwner = createAbstraction<IProcessOwner>("Standalone/ProcessOwner");

export namespace ProcessOwner {
    export type Interface = IProcessOwner;
}
