import { EventType } from "@webiny/event-handler-core";
import type { IEventType } from "@webiny/event-handler-core";
import { SyncWorkerEventHandler } from "./SyncWorkerEventHandler.js";
import type { ISyncWorkerEvent } from "./SyncWorkerEventHandler.js";

const SYNC_WORKER_ACTIONS = [
    "copyFile",
    "deleteFile",
    "createUser",
    "updateUser",
    "deleteUser"
] as const;

class SyncWorkerEventTypeImpl implements IEventType<ISyncWorkerEvent> {
    canHandle(event: any): event is ISyncWorkerEvent {
        return (
            typeof event?.action === "string" &&
            SYNC_WORKER_ACTIONS.includes(event.action as (typeof SYNC_WORKER_ACTIONS)[number])
        );
    }

    getHandlerAbstraction() {
        return SyncWorkerEventHandler;
    }
}

export const SyncWorkerEventType = EventType.createImplementation({
    implementation: SyncWorkerEventTypeImpl,
    dependencies: []
});
