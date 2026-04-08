import {
    GetModelGroupRepository as RepositoryAbstraction,
    GetModelGroupGateway
} from "./abstractions.js";
import { ModelGroupsCache } from "~/features/modelGroup/abstractions.js";

class GetModelGroupRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ModelGroupsCache.Interface,
        private gateway: GetModelGroupGateway.Interface
    ) {}

    async execute(id: string) {
        const result = await this.gateway.execute(id);
        this.cache.addItems([result]);
        return result;
    }
}

export const GetModelGroupRepository = RepositoryAbstraction.createImplementation({
    implementation: GetModelGroupRepositoryImpl,
    dependencies: [ModelGroupsCache, GetModelGroupGateway]
});
