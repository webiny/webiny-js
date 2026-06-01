import { GetEntryRepository as RepositoryAbstraction, GetEntryGateway } from "./abstractions.js";
import { ContentEntriesCache } from "~/features/contentEntry/abstractions.js";
import type { IGetEntryParams } from "./abstractions.js";

class GetEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ContentEntriesCache.Interface,
        private gateway: GetEntryGateway.Interface
    ) {}

    async execute(params: IGetEntryParams) {
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

export const GetEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: GetEntryRepositoryImpl,
    dependencies: [ContentEntriesCache, GetEntryGateway]
});
