import { MoveEntryRepository as RepositoryAbstraction, MoveEntryGateway } from "./abstractions.js";
import { ContentEntriesCache } from "~/features/contentEntry/abstractions.js";
import type { IMoveEntryParams } from "./abstractions.js";

class MoveEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ContentEntriesCache.Interface,
        private gateway: MoveEntryGateway.Interface
    ) {}

    async execute(params: IMoveEntryParams) {
        const result = await this.gateway.execute(params);

        this.cache.removeItems(item => item.id === params.id);

        return result;
    }
}

export const MoveEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: MoveEntryRepositoryImpl,
    dependencies: [ContentEntriesCache, MoveEntryGateway]
});
