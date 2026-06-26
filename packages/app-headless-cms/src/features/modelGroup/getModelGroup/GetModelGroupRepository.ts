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
        const existing = this.cache.getItem(item => item.id === id);

        if (existing) {
            this.cache.updateItems(item => (item.id === id ? { ...existing, ...result } : item));
        } else {
            this.cache.addItems([result]);
        }

        return existing ? { ...existing, ...result } : result;
    }
}

export const GetModelGroupRepository = RepositoryAbstraction.createImplementation({
    implementation: GetModelGroupRepositoryImpl,
    dependencies: [ModelGroupsCache, GetModelGroupGateway]
});
