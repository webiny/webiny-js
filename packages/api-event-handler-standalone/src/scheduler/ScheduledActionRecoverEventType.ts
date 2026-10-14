import { EventType } from "@webiny/event-handler-core";
import type { IEventType } from "@webiny/event-handler-core";
import { ScheduledActionRecoverEventHandler } from "./ScheduledActionRecoverEventHandler.js";

export const SCHEDULED_ACTION_RECOVER_EVENT_IDENTIFIER = "WebinyScheduledActionRecover";

/**
 * Asks the scheduler to re-arm the root tenant's pending scheduled actions. Dispatched once at
 * boot: Bree keeps its timers in memory, so a restart loses every schedule that has not fired yet.
 */
export interface IScheduledActionRecoverEvent {
    [SCHEDULED_ACTION_RECOVER_EVENT_IDENTIFIER]: true;
}

class ScheduledActionRecoverEventTypeImpl implements IEventType<IScheduledActionRecoverEvent> {
    canHandle(event: any): event is IScheduledActionRecoverEvent {
        return event?.[SCHEDULED_ACTION_RECOVER_EVENT_IDENTIFIER] === true;
    }

    getHandlerAbstraction() {
        return ScheduledActionRecoverEventHandler;
    }
}

export const ScheduledActionRecoverEventType = EventType.createImplementation({
    implementation: ScheduledActionRecoverEventTypeImpl,
    dependencies: []
});
