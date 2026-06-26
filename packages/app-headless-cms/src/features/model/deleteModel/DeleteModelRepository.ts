import {
    DeleteModelRepository as RepositoryAbstraction,
    DeleteModelGateway
} from "./abstractions.js";
import { ModelsCache } from "~/features/model/abstractions.js";

class DeleteModelRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ModelsCache.Interface,
        private gateway: DeleteModelGateway.Interface
    ) {}

    async execute(modelId: string, confirmation: string) {
        const result = await this.gateway.execute(modelId, confirmation);
        this.cache.updateItems(item =>
            item.modelId === modelId ? { ...item, isBeingDeleted: true } : item
        );
        return result;
    }
}

export const DeleteModelRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteModelRepositoryImpl,
    dependencies: [ModelsCache, DeleteModelGateway]
});
