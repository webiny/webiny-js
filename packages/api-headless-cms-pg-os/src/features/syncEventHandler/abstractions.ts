import { createAbstraction } from "@webiny/feature/api/index.js";
import type { SyncEvent } from "~/types.js";

export interface ISyncEventHandlerProcessOptions {
    batchSize?: number;
}

export interface ISyncEventHandler {
    process(events: SyncEvent[], options?: ISyncEventHandlerProcessOptions): Promise<void>;
}

export const SyncEventHandler = createAbstraction<ISyncEventHandler>("Cms/PgOs/SyncEventHandler");

export namespace SyncEventHandler {
    export type Interface = ISyncEventHandler;
    export type ProcessOptions = ISyncEventHandlerProcessOptions;
}
