import {
    UnpublishEntryRepository as RepositoryAbstraction,
    UnpublishEntryGateway
} from "./abstractions.js";
import { ContentEntriesCacheProvider } from "~/features/contentEntry/abstractions.js";
import type { IUnpublishEntryParams } from "./abstractions.js";

class UnpublishEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cacheProvider: ContentEntriesCacheProvider.Interface,
        private gateway: UnpublishEntryGateway.Interface
    ) {}

    async execute(params: IUnpublishEntryParams) {
        const entry = await this.gateway.execute(params);

        const cache = this.cacheProvider.get(params.model.modelId);
        cache.addItems([entry]);

        return entry;
    }
}

export const UnpublishEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: UnpublishEntryRepositoryImpl,
    dependencies: [ContentEntriesCacheProvider, UnpublishEntryGateway]
});
