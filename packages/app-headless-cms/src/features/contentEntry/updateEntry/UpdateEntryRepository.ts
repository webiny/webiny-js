import {
    UpdateEntryRepository as RepositoryAbstraction,
    UpdateEntryGateway
} from "./abstractions.js";
import { ContentEntriesCache } from "~/features/contentEntry/abstractions.js";
import type { IUpdateEntryParams } from "./abstractions.js";

class UpdateEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ContentEntriesCache.Interface,
        private gateway: UpdateEntryGateway.Interface
    ) {}

    async execute(params: IUpdateEntryParams) {
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

export const UpdateEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateEntryRepositoryImpl,
    dependencies: [ContentEntriesCache, UpdateEntryGateway]
});
