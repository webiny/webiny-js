import {
    DuplicateEntryRepository as RepositoryAbstraction,
    DuplicateEntryGateway
} from "./abstractions.js";
import type { IDuplicateEntryParams } from "./abstractions.js";
import { ContentEntriesCacheProvider } from "~/features/contentEntry/abstractions.js";
import { EventPublisher } from "@webiny/app/features/eventPublisher/index.js";
import { EntryAfterCreateEvent } from "~/features/contentEntry/events/EntryAfterCreateEvent.js";

class DuplicateEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cacheProvider: ContentEntriesCacheProvider.Interface,
        private gateway: DuplicateEntryGateway.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(params: IDuplicateEntryParams) {
        const entry = await this.gateway.execute(params);

        const cache = this.cacheProvider.get(params.model.modelId);
        cache.addItems([entry]);

        // Duplicating results in a brand-new entry, so we notify the same listeners as on create.
        await this.eventPublisher.publish(
            new EntryAfterCreateEvent({ entry, model: params.model })
        );

        return entry;
    }
}

export const DuplicateEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: DuplicateEntryRepositoryImpl,
    dependencies: [ContentEntriesCacheProvider, DuplicateEntryGateway, EventPublisher]
});
