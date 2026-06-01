import {
    CreateRevisionFromRepository as RepositoryAbstraction,
    CreateRevisionFromGateway
} from "./abstractions.js";
import { ContentEntriesCache } from "~/features/contentEntry/abstractions.js";
import type { ICreateRevisionFromParams } from "./abstractions.js";

class CreateRevisionFromRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ContentEntriesCache.Interface,
        private gateway: CreateRevisionFromGateway.Interface
    ) {}

    async execute(params: ICreateRevisionFromParams) {
        const entry = await this.gateway.execute(params);

        this.cache.addItems([entry]);

        return entry;
    }
}

export const CreateRevisionFromRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateRevisionFromRepositoryImpl,
    dependencies: [ContentEntriesCache, CreateRevisionFromGateway]
});
