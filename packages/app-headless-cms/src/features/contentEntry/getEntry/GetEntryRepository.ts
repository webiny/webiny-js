import { GetEntryRepository as RepositoryAbstraction, GetEntryGateway } from "./abstractions.js";
import { ContentEntriesCacheProvider } from "~/features/contentEntry/abstractions.js";
import type { IGetEntryParams } from "./abstractions.js";

class GetEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cacheProvider: ContentEntriesCacheProvider.Interface,
        private gateway: GetEntryGateway.Interface
    ) {}

    async execute(params: IGetEntryParams) {
        const entry = await this.gateway.execute(params);

        const cache = this.cacheProvider.get(params.model.modelId);
        cache.addItems([entry]);

        return entry;
    }
}

export const GetEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: GetEntryRepositoryImpl,
    dependencies: [ContentEntriesCacheProvider, GetEntryGateway]
});
