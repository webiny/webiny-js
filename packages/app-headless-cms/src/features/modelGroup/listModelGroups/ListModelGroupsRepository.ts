import {
    ListModelGroupsRepository as RepositoryAbstraction,
    ListModelGroupsGateway
} from "./abstractions.js";
import { ModelGroupsCache } from "~/features/modelGroup/abstractions.js";

class ListModelGroupsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ModelGroupsCache.Interface,
        private gateway: ListModelGroupsGateway.Interface
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

export const ListModelGroupsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListModelGroupsRepositoryImpl,
    dependencies: [ModelGroupsCache, ListModelGroupsGateway]
});
