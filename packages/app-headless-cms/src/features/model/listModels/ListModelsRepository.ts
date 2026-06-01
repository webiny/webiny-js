import {
    ListModelsRepository as RepositoryAbstraction,
    ListModelsGateway
} from "./abstractions.js";
import { ModelsCache } from "~/features/model/abstractions.js";

class ListModelsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ModelsCache.Interface,
        private gateway: ListModelsGateway.Interface
    ) {}

    async execute() {
        if (this.cache.hasItems()) {
            return this.cache.getItems();
        }

        const items = await this.gateway.execute();

        this.cache.clear();
        this.cache.addItems(items);

        return this.cache.getItems();
    }
}

export const ListModelsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListModelsRepositoryImpl,
    dependencies: [ModelsCache, ListModelsGateway]
});
