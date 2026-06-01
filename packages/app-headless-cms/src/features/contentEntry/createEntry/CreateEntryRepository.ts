import {
    CreateEntryRepository as RepositoryAbstraction,
    CreateEntryGateway
} from "./abstractions.js";
import { ContentEntriesCache } from "~/features/contentEntry/abstractions.js";
import type { ICreateEntryGatewayParams } from "./abstractions.js";

class CreateEntryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ContentEntriesCache.Interface,
        private gateway: CreateEntryGateway.Interface
    ) {}

    async execute(params: ICreateEntryGatewayParams) {
        const entry = await this.gateway.execute(params);

        this.cache.addItems([entry]);

        return entry;
    }
}

export const CreateEntryRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateEntryRepositoryImpl,
    dependencies: [ContentEntriesCache, CreateEntryGateway]
});
