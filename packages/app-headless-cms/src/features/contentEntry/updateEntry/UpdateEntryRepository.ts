import {
    UpdateEntryRepository as RepositoryAbstraction,
    UpdateEntryGateway
} from "./abstractions.js";
import { ContentEntriesCacheProvider } from "~/features/contentEntry/abstractions.js";
import type { IUpdateEntryParams } from "./abstractions.js";

class UpdateEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cacheProvider: ContentEntriesCacheProvider.Interface,
        private gateway: UpdateEntryGateway.Interface
    ) {}

    async execute(params: IUpdateEntryParams) {
        const entry = await this.gateway.execute(params);

        const cache = this.cacheProvider.get(params.model.modelId);
        cache.addItems([entry]);

        return entry;
    }
}

export const UpdateEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateEntryRepositoryImpl,
    dependencies: [ContentEntriesCacheProvider, UpdateEntryGateway]
});
