import type { CreateModelGroupParams } from "./abstractions.js";
import {
    CreateModelGroupRepository as RepositoryAbstraction,
    CreateModelGroupGateway
} from "./abstractions.js";
import { ModelGroupsCache } from "~/features/modelGroup/abstractions.js";

class CreateModelGroupRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ModelGroupsCache.Interface,
        private gateway: CreateModelGroupGateway.Interface
    ) {}

    async execute(params: CreateModelGroupParams) {
        const result = await this.gateway.execute(params);
        this.cache.addItems([result]);
        return result;
    }
}

export const CreateModelGroupRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateModelGroupRepositoryImpl,
    dependencies: [ModelGroupsCache, CreateModelGroupGateway]
});
