import { MoveEntryRepository as RepositoryAbstraction, MoveEntryGateway } from "./abstractions.js";
import { ContentEntriesCacheProvider } from "~/features/contentEntry/abstractions.js";
import type { IMoveEntryParams } from "./abstractions.js";

class MoveEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cacheProvider: ContentEntriesCacheProvider.Interface,
        private gateway: MoveEntryGateway.Interface
    ) {}

    async execute(params: IMoveEntryParams) {
        const result = await this.gateway.execute(params);

        const cache = this.cacheProvider.get(params.model.modelId);
        cache.removeItems(item => item.id === params.id);

        return result;
    }
}

export const MoveEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: MoveEntryRepositoryImpl,
    dependencies: [ContentEntriesCacheProvider, MoveEntryGateway]
});
