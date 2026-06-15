import { EventType } from "@webiny/event-handler-core";
import type { IEventType } from "@webiny/event-handler-core";
import { ScheduledActionEventHandler } from "~/abstractions/handlers/ScheduledActionEventHandler.js";

export const SCHEDULED_ACTION_EVENT_IDENTIFIER = "WebinyScheduledAction";

export interface IScheduledActionEventPayload {
    namespace: string;
    id: string;
    scheduleFor: string;
}

export interface IScheduledActionEvent {
    [SCHEDULED_ACTION_EVENT_IDENTIFIER]: IScheduledActionEventPayload;
}

class ScheduledActionEventTypeImpl implements IEventType<IScheduledActionEvent> {
    canHandle(event: any): event is IScheduledActionEvent {
        const value = event?.[SCHEDULED_ACTION_EVENT_IDENTIFIER];
        return !!(value?.id && value?.scheduleFor);
    }

    getHandlerAbstraction() {
        return ScheduledActionEventHandler;
    }
}

export const ScheduledActionEventType = EventType.createImplementation({
    implementation: ScheduledActionEventTypeImpl,
    dependencies: []
});
