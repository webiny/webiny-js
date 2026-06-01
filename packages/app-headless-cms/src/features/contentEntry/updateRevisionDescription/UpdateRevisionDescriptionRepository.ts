import {
    UpdateRevisionDescriptionRepository as RepositoryAbstraction,
    UpdateRevisionDescriptionGateway
} from "./abstractions.js";
import { ContentEntriesCache } from "~/features/contentEntry/abstractions.js";
import type { IUpdateRevisionDescriptionParams } from "./abstractions.js";

class UpdateRevisionDescriptionRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ContentEntriesCache.Interface,
        private gateway: UpdateRevisionDescriptionGateway.Interface
    ) {}

    async execute(params: IUpdateRevisionDescriptionParams) {
        const entry = await this.gateway.execute(params);

        this.cache.updateItems(item => {
            if (item.id === entry.id) {
                return entry;
            }
            return item;
        });

        return entry;
    }
}

export const UpdateRevisionDescriptionRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateRevisionDescriptionRepositoryImpl,
    dependencies: [ContentEntriesCache, UpdateRevisionDescriptionGateway]
});
