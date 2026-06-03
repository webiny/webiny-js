import {
    RestoreFromTrashRepository as RepositoryAbstraction,
    RestoreFromTrashGateway
} from "./abstractions.js";
import { ContentEntriesCache } from "~/features/contentEntry/abstractions.js";
import type { IRestoreFromTrashParams } from "./abstractions.js";

class RestoreFromTrashRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ContentEntriesCache.Interface,
        private gateway: RestoreFromTrashGateway.Interface
    ) {}

    async execute(params: IRestoreFromTrashParams) {
        const entry = await this.gateway.execute(params);

        this.cache.addItems([entry]);

        return entry;
    }
}

export const RestoreFromTrashRepository = RepositoryAbstraction.createImplementation({
    implementation: RestoreFromTrashRepositoryImpl,
    dependencies: [ContentEntriesCache, RestoreFromTrashGateway]
});
