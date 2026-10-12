import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import type { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";

/** Every event published while the decorator is registered. Reset it at the start of a test. */
export const recordedEvents: DomainEvent<any>[] = [];

class RecordingEventPublisherImpl implements EventPublisher.Interface {
    constructor(private decoratee: EventPublisher.Interface) {}

    async publish<TEvent extends DomainEvent<any>>(event: TEvent): Promise<void> {
        recordedEvents.push(event);
        await this.decoratee.publish(event);
    }
}

export const RecordingEventPublisher = EventPublisher.createDecorator({
    decorator: RecordingEventPublisherImpl,
    dependencies: []
});
