import {
    CreateRevisionFromRepository as RepositoryAbstraction,
    CreateRevisionFromGateway
} from "./abstractions.js";
import { ContentEntriesCacheProvider } from "~/features/contentEntry/abstractions.js";
import type { ICreateRevisionFromParams } from "./abstractions.js";

class CreateRevisionFromRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cacheProvider: ContentEntriesCacheProvider.Interface,
        private gateway: CreateRevisionFromGateway.Interface
    ) {}

    async execute(params: ICreateRevisionFromParams) {
        const entry = await this.gateway.execute(params);

        const cache = this.cacheProvider.get(params.model.modelId);
        cache.addItems([entry]);

        return entry;
    }
}

export const CreateRevisionFromRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateRevisionFromRepositoryImpl,
    dependencies: [ContentEntriesCacheProvider, CreateRevisionFromGateway]
});
