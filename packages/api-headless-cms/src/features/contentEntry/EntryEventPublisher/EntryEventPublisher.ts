import { createImplementation } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { EntryEventPublisher as Abstraction, type EntryDomainEvent } from "./abstractions.js";
import type { CmsModel } from "~/types/index.js";

class EntryEventPublisherImpl implements Abstraction.Interface {
    public constructor(private eventPublisher: EventPublisher.Interface) {}

    public async publish<TEvent extends EntryDomainEvent>(event: TEvent): Promise<void> {
        if (!this.hasLifecycleEvents(event.payload.model)) {
            return;
        }

        await this.eventPublisher.publish(event);
    }

    private hasLifecycleEvents(model: CmsModel): boolean {
        return !(model.isPrivate && model.settings?.lifecycleEvents === false);
    }
}

export const EntryEventPublisher = createImplementation({
    abstraction: Abstraction,
    implementation: EntryEventPublisherImpl,
    dependencies: [EventPublisher]
});
