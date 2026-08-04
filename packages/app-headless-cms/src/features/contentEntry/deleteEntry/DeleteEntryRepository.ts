import {
    DeleteEntryRepository as RepositoryAbstraction,
    DeleteEntryGateway
} from "./abstractions.js";
import { ContentEntriesCacheProvider } from "~/features/contentEntry/abstractions.js";
import type { IDeleteEntryParams } from "./abstractions.js";
import { EventPublisher } from "@webiny/app/features/eventPublisher/index.js";
import { EntryAfterDeleteEvent } from "~/features/contentEntry/events/EntryAfterDeleteEvent.js";

class DeleteEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cacheProvider: ContentEntriesCacheProvider.Interface,
        private gateway: DeleteEntryGateway.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(params: IDeleteEntryParams) {
        const result = await this.gateway.execute(params);

        const cache = this.cacheProvider.get(params.model.modelId);
        cache.removeItems(item => item.id === params.id || item.entryId === params.id);

        const entryId = params.id.includes("#") ? params.id.split("#")[0] : params.id;
        await this.eventPublisher.publish(
            new EntryAfterDeleteEvent({ model: params.model, id: params.id, entryId })
        );

        return result;
    }
}

export const DeleteEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteEntryRepositoryImpl,
    dependencies: [ContentEntriesCacheProvider, DeleteEntryGateway, EventPublisher]
});
