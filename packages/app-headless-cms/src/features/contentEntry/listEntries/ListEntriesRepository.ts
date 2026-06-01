import {
    ListEntriesRepository as RepositoryAbstraction,
    ListEntriesGateway
} from "./abstractions.js";
import { ContentEntriesCache } from "~/features/contentEntry/abstractions.js";
import type { IListEntriesRepositoryParams } from "./abstractions.js";

class ListEntriesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ContentEntriesCache.Interface,
        private gateway: ListEntriesGateway.Interface
    ) {}

    async execute(params: IListEntriesRepositoryParams) {
        const result = await this.gateway.execute(params);

        this.cache.addItems(result.data);

        return result;
    }
}

export const ListEntriesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListEntriesRepositoryImpl,
    dependencies: [ContentEntriesCache, ListEntriesGateway]
});
