import {
    DeleteEntryRevisionRepository as RepositoryAbstraction,
    DeleteEntryRevisionGateway
} from "./abstractions.js";
import { ContentEntriesCacheProvider } from "~/features/contentEntry/abstractions.js";
import type { IDeleteEntryRevisionParams } from "./abstractions.js";

class DeleteEntryRevisionRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cacheProvider: ContentEntriesCacheProvider.Interface,
        private gateway: DeleteEntryRevisionGateway.Interface
    ) {}

    async execute(params: IDeleteEntryRevisionParams) {
        const result = await this.gateway.execute(params);

        const cache = this.cacheProvider.get(params.model.modelId);
        cache.removeItems(item => item.id === params.revisionId);

        return result;
    }
}

export const DeleteEntryRevisionRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteEntryRevisionRepositoryImpl,
    dependencies: [ContentEntriesCacheProvider, DeleteEntryRevisionGateway]
});
