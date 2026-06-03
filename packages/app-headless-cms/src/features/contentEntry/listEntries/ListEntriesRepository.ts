import {
    ListEntriesRepository as RepositoryAbstraction,
    ListEntriesGateway
} from "./abstractions.js";
import { ContentEntriesCacheProvider } from "~/features/contentEntry/abstractions.js";
import type { IListEntriesRepositoryParams } from "./abstractions.js";

class ListEntriesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cacheProvider: ContentEntriesCacheProvider.Interface,
        private gateway: ListEntriesGateway.Interface
    ) {}

    async execute(params: IListEntriesRepositoryParams) {
        const result = await this.gateway.execute(params);

        const cache = this.cacheProvider.get(params.model.modelId);
        cache.addItems(result.data);

        return result;
    }
}

export const ListEntriesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListEntriesRepositoryImpl,
    dependencies: [ContentEntriesCacheProvider, ListEntriesGateway]
});
