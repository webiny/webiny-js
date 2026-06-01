import {
    UnpublishEntryRepository as RepositoryAbstraction,
    UnpublishEntryGateway
} from "./abstractions.js";
import { ContentEntriesCache } from "~/features/contentEntry/abstractions.js";
import type { IUnpublishEntryParams } from "./abstractions.js";

class UnpublishEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ContentEntriesCache.Interface,
        private gateway: UnpublishEntryGateway.Interface
    ) {}

    async execute(params: IUnpublishEntryParams) {
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

export const UnpublishEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: UnpublishEntryRepositoryImpl,
    dependencies: [ContentEntriesCache, UnpublishEntryGateway]
});
