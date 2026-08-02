import {
    DeleteEntryRepository as RepositoryAbstraction,
    DeleteEntryGateway
} from "./abstractions.js";
import { ContentEntriesCacheProvider } from "~/features/contentEntry/abstractions.js";
import type { IDeleteEntryParams } from "./abstractions.js";

class DeleteEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cacheProvider: ContentEntriesCacheProvider.Interface,
        private gateway: DeleteEntryGateway.Interface
    ) {}

    async execute(params: IDeleteEntryParams) {
        const result = await this.gateway.execute(params);

        const cache = this.cacheProvider.get(params.model.modelId);
        cache.removeItems(item => item.id === params.id || item.entryId === params.id);

        return result;
    }
}

export const DeleteEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteEntryRepositoryImpl,
    dependencies: [ContentEntriesCacheProvider, DeleteEntryGateway]
});
