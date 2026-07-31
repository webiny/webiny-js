import {
    CreateEntryRepository as RepositoryAbstraction,
    CreateEntryGateway
} from "./abstractions.js";
import { ContentEntriesCacheProvider } from "~/features/contentEntry/abstractions.js";
import type { ICreateEntryGatewayParams } from "./abstractions.js";

class CreateEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cacheProvider: ContentEntriesCacheProvider.Interface,
        private gateway: CreateEntryGateway.Interface
    ) {}

    async execute(params: ICreateEntryGatewayParams) {
        const entry = await this.gateway.execute(params);

        const cache = this.cacheProvider.get(params.model.modelId);
        cache.addItems([entry]);

        return entry;
    }
}

export const CreateEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateEntryRepositoryImpl,
    dependencies: [ContentEntriesCacheProvider, CreateEntryGateway]
});
