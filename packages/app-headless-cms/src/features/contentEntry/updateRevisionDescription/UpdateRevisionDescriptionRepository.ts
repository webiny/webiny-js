import {
    UpdateRevisionDescriptionRepository as RepositoryAbstraction,
    UpdateRevisionDescriptionGateway
} from "./abstractions.js";
import { ContentEntriesCacheProvider } from "~/features/contentEntry/abstractions.js";
import type { IUpdateRevisionDescriptionParams } from "./abstractions.js";

class UpdateRevisionDescriptionRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cacheProvider: ContentEntriesCacheProvider.Interface,
        private gateway: UpdateRevisionDescriptionGateway.Interface
    ) {}

    async execute(params: IUpdateRevisionDescriptionParams) {
        const entry = await this.gateway.execute(params);

        const cache = this.cacheProvider.get(params.model.modelId);
        cache.addItems([entry]);

        return entry;
    }
}

export const UpdateRevisionDescriptionRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateRevisionDescriptionRepositoryImpl,
    dependencies: [ContentEntriesCacheProvider, UpdateRevisionDescriptionGateway]
});
