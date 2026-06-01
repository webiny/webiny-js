import {
    PublishEntryRepository as RepositoryAbstraction,
    PublishEntryGateway
} from "./abstractions.js";
import { ContentEntriesCache } from "~/features/contentEntry/abstractions.js";
import type { IPublishEntryParams } from "./abstractions.js";

class PublishEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ContentEntriesCache.Interface,
        private gateway: PublishEntryGateway.Interface
    ) {}

    async execute(params: IPublishEntryParams) {
        const entry = await this.gateway.execute(params);

        this.cache.updateItems(item => {
            if (item.id === entry.id) {
                return entry;
            }
            return item;
        });

        return entry;
    }
}

export const PublishEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: PublishEntryRepositoryImpl,
    dependencies: [ContentEntriesCache, PublishEntryGateway]
});
