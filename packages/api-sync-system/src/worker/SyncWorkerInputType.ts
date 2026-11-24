import { InputType } from "@webiny/api-kernel-core";

import { SyncWorkerInputHandler } from "./SyncWorkerInputHandler.js";
import type { ISyncWorkerEvent } from "./SyncWorkerInputHandler.js";

const SYNC_WORKER_ACTIONS = [
    "copyFile",
    "deleteFile",
    "createUser",
    "updateUser",
    "deleteUser"
] as const;

class SyncWorkerInputTypeImpl implements InputType.Interface<ISyncWorkerEvent> {
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
