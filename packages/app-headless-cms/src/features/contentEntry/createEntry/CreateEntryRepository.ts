import {
    CreateEntryRepository as RepositoryAbstraction,
    CreateEntryGateway
} from "./abstractions.js";
import { ContentEntriesCacheProvider } from "~/features/contentEntry/abstractions.js";
import type { ICreateEntryGatewayParams } from "./abstractions.js";
import { EventPublisher } from "@webiny/app/features/eventPublisher/index.js";
import { EntryAfterCreateEvent } from "~/features/contentEntry/events/EntryAfterCreateEvent.js";

class CreateEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cacheProvider: ContentEntriesCacheProvider.Interface,
        private gateway: CreateEntryGateway.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(params: ICreateEntryGatewayParams) {
        const entry = await this.gateway.execute(params);

        const cache = this.cacheProvider.get(params.model.modelId);
        cache.addItems([entry]);

        await this.eventPublisher.publish(
            new EntryAfterCreateEvent({ entry, model: params.model })
        );

        return entry;
    }
}

export const CreateEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateEntryRepositoryImpl,
    dependencies: [ContentEntriesCacheProvider, CreateEntryGateway, EventPublisher]
});
