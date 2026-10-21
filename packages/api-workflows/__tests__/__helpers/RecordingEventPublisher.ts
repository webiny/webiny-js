import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import type { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import { callLog } from "./callLog.js";

/** Every event published while the decorator is registered. Reset it at the start of a test. */
export const recordedEvents: DomainEvent<any>[] = [];

/** Event types published by workflows, in order. */
export const workflowEventTypes = (): string[] => {
    return recordedEvents
        .map(event => event.eventType)
        .filter(eventType => eventType.startsWith("Workflows/"));
};

class RecordingEventPublisherImpl implements EventPublisher.Interface {
    constructor(private decoratee: EventPublisher.Interface) {}

    async publish<TEvent extends DomainEvent<any>>(event: TEvent): Promise<void> {
        recordedEvents.push(event);
        callLog.push(`event:${event.eventType}`);
        await this.decoratee.publish(event);
    }
}

export const RecordingEventPublisher = EventPublisher.createDecorator({
    decorator: RecordingEventPublisherImpl,
    dependencies: []
});
