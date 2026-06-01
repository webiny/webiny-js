import {
    DeleteEntryRevisionRepository as RepositoryAbstraction,
    DeleteEntryRevisionGateway
} from "./abstractions.js";
import { ContentEntriesCache } from "~/features/contentEntry/abstractions.js";
import type { IDeleteEntryRevisionParams } from "./abstractions.js";

class DeleteEntryRevisionRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ContentEntriesCache.Interface,
        private gateway: DeleteEntryRevisionGateway.Interface
    ) {}

    async execute(params: IDeleteEntryRevisionParams) {
        const result = await this.gateway.execute(params);

        this.cache.removeItems(item => item.id === params.revisionId);

        return result;
    }
}

export const DeleteEntryRevisionRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteEntryRevisionRepositoryImpl,
    dependencies: [ContentEntriesCache, DeleteEntryRevisionGateway]
});
