import type { UpdateModelGroupParams } from "./abstractions.js";
import {
    UpdateModelGroupRepository as RepositoryAbstraction,
    UpdateModelGroupGateway
} from "./abstractions.js";
import { ModelGroupsCache } from "~/features/modelGroup/abstractions.js";

class UpdateModelGroupRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ModelGroupsCache.Interface,
        private gateway: UpdateModelGroupGateway.Interface
    ) {}

    async execute(params: UpdateModelGroupParams) {
        const { id, ...data } = params;
        const result = await this.gateway.execute(id, data);

        this.cache.updateItems(group => {
            if (group.id === id) {
                return { ...group, ...result };
            }
            return group;
        });

        return result;
    }
}

export const UpdateModelGroupRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateModelGroupRepositoryImpl,
    dependencies: [ModelGroupsCache, UpdateModelGroupGateway]
});
