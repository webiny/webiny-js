import { createAbstraction } from "@webiny/feature/api";
import type { IInputHandler } from "@webiny/kernel-core";

export interface ISyncWorkerEvent {
    action: string;
    [key: string]: unknown;
}

export interface ISyncWorkerResult {
    success: boolean;
}

export interface ISyncWorkerInputHandler extends IInputHandler<
    ISyncWorkerEvent,
    ISyncWorkerResult
> {}

export const SyncWorkerInputHandler =
    createAbstraction<ISyncWorkerInputHandler>("SyncWorkerInputHandler");

export namespace SyncWorkerInputHandler {
    export type Interface = ISyncWorkerInputHandler;
}
