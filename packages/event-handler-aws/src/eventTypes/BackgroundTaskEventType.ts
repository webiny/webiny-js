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
        return !!(event?.webinyTaskId && event?.webinyTaskDefinitionId && event?.tenant);
    }

    getHandlerAbstraction() {
        return BackgroundTaskEventHandler;
    }
}

export const BackgroundTaskEventType = EventType.createImplementation({
    implementation: BackgroundTaskEventTypeImpl,
    dependencies: []
});
