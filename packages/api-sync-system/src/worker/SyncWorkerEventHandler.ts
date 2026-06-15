import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/event-handler-core";

export interface ISyncWorkerEvent {
    action: string;
    [key: string]: unknown;
}

export interface ISyncWorkerResult {
    success: boolean;
}

export interface ISyncWorkerEventHandler extends IEventHandler<
    ISyncWorkerEvent,
    ISyncWorkerResult
> {}

export const SyncWorkerEventHandler =
    createAbstraction<ISyncWorkerEventHandler>("SyncWorkerEventHandler");

export namespace SyncWorkerEventHandler {
    export type Interface = ISyncWorkerEventHandler;
}
