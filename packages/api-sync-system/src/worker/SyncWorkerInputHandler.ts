import { createAbstraction } from "@webiny/feature/api";
import type { InputHandler } from "@webiny/kernel-core";

export interface ISyncWorkerEvent {
    action: string;
    [key: string]: unknown;
}

export interface ISyncWorkerResult {
    success: boolean;
}

export interface ISyncWorkerInputHandler extends InputHandler.Interface<
    ISyncWorkerEvent,
    ISyncWorkerResult
> {}

export const SyncWorkerInputHandler =
    createAbstraction<ISyncWorkerInputHandler>("SyncWorkerInputHandler");

export namespace SyncWorkerInputHandler {
    export type Interface = ISyncWorkerInputHandler;
}
