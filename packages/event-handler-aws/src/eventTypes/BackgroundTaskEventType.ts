import { EventType } from "@webiny/event-handler-core";
import type { IEventType } from "@webiny/event-handler-core";
import { BackgroundTaskEventHandler } from "~/abstractions/handlers/BackgroundTaskEventHandler.js";

export interface IBackgroundTaskEvent {
    webinyTaskId: string;
    webinyTaskDefinitionId: string;
    tenant: string;
    endpoint: string;
    executionName: string;
    stateMachineId: string;
    delay?: number;
}

class BackgroundTaskEventTypeImpl implements IEventType<IBackgroundTaskEvent> {
    canHandle(event: any): event is IBackgroundTaskEvent {
        // The Step Functions / EventBridge transport delivers the task wrapped as
        // `{ name: "background-task", payload: { webinyTaskId, ... } }` (see the bg-task SFN ASL
        // definition in project-aws). Unwrap `payload` if present; also accept an already-flat event
        // defensively so direct invokes still work.
        const e = event?.payload ?? event;
        return !!(e?.webinyTaskId && e?.webinyTaskDefinitionId && e?.tenant);
    }

    getHandlerAbstraction() {
        return BackgroundTaskEventHandler;
    }
}

export const BackgroundTaskEventType = EventType.createImplementation({
    implementation: BackgroundTaskEventTypeImpl,
    dependencies: []
});
