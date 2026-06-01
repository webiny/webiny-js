import {
    DeleteEntryRepository as RepositoryAbstraction,
    DeleteEntryGateway
} from "./abstractions.js";
import { ContentEntriesCache } from "~/features/contentEntry/abstractions.js";
import type { IDeleteEntryParams } from "./abstractions.js";

class DeleteEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ContentEntriesCache.Interface,
        private gateway: DeleteEntryGateway.Interface
    ) {}

    async execute(params: IDeleteEntryParams) {
        const result = await this.gateway.execute(params);

        this.cache.removeItems(item => item.id === params.id || item.entryId === params.id);

        return result;
    }
}

export const DeleteEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteEntryRepositoryImpl,
    dependencies: [ContentEntriesCache, DeleteEntryGateway]
});
