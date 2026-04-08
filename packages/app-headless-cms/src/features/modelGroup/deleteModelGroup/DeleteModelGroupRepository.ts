import {
    DeleteModelGroupRepository as RepositoryAbstraction,
    DeleteModelGroupGateway
} from "./abstractions.js";
import { ModelGroupsCache } from "~/features/modelGroup/abstractions.js";

class DeleteModelGroupRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ModelGroupsCache.Interface,
        private gateway: DeleteModelGroupGateway.Interface
    ) {}

    async execute(id: string) {
        await this.gateway.execute(id);
        this.cache.removeItems(group => group.id === id);
    }
}

export const DeleteModelGroupRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteModelGroupRepositoryImpl,
    dependencies: [ModelGroupsCache, DeleteModelGroupGateway]
});
