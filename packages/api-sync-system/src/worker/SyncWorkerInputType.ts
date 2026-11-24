import { InputType } from "@webiny/kernel-core";
import type { IInputType } from "@webiny/kernel-core";
import { SyncWorkerInputHandler } from "./SyncWorkerInputHandler.js";
import type { ISyncWorkerEvent } from "./SyncWorkerInputHandler.js";

const SYNC_WORKER_ACTIONS = [
    "copyFile",
    "deleteFile",
    "createUser",
    "updateUser",
    "deleteUser"
] as const;

class SyncWorkerInputTypeImpl implements IInputType<ISyncWorkerEvent> {
    matches(input: any): input is ISyncWorkerEvent {
        return (
            typeof input?.action === "string" &&
            SYNC_WORKER_ACTIONS.includes(input.action as (typeof SYNC_WORKER_ACTIONS)[number])
        );
    }

    getHandlerAbstraction() {
        return SyncWorkerInputHandler;
    }
}

export const SyncWorkerInputType = InputType.createImplementation({
    implementation: SyncWorkerInputTypeImpl,
    dependencies: []
});
