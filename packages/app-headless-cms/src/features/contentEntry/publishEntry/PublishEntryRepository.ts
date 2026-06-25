import {
    PublishEntryRepository as RepositoryAbstraction,
    PublishEntryGateway
} from "./abstractions.js";
import { ContentEntriesCacheProvider } from "~/features/contentEntry/abstractions.js";
import type { IPublishEntryParams } from "./abstractions.js";

class PublishEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cacheProvider: ContentEntriesCacheProvider.Interface,
        private gateway: PublishEntryGateway.Interface
    ) {}

    async execute(params: IPublishEntryParams) {
        const entry = await this.gateway.execute(params);

        const cache = this.cacheProvider.get(params.model.modelId);
        cache.addItems([entry]);

        return entry;
    }
}

export const PublishEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: PublishEntryRepositoryImpl,
    dependencies: [ContentEntriesCacheProvider, PublishEntryGateway]
});
