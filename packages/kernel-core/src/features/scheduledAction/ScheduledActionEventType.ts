import { EventType } from "~/features/events/EventType.js";
import type { IEventType } from "~/features/events/EventType.js";
import { ScheduledActionEventHandler } from "./ScheduledActionEventHandler.js";

export const SCHEDULED_ACTION_EVENT_IDENTIFIER = "WebinyScheduledAction";

export interface IScheduledActionEventPayload {
    namespace: string;
    id: string;
    scheduleFor: string;
    tenant: string;
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
