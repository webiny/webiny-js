import {
    CancelDeleteModelRepository as RepositoryAbstraction,
    CancelDeleteModelGateway
} from "./abstractions.js";
import { ModelsCache } from "~/features/model/abstractions.js";

class CancelDeleteModelRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ModelsCache.Interface,
        private gateway: CancelDeleteModelGateway.Interface
    ) {}

    async execute(modelId: string) {
        await this.gateway.execute(modelId);
        this.cache.updateItems(item =>
            item.modelId === modelId ? { ...item, isBeingDeleted: false } : item
        );
    }
}

export const CancelDeleteModelRepository = RepositoryAbstraction.createImplementation({
    implementation: CancelDeleteModelRepositoryImpl,
    dependencies: [ModelsCache, CancelDeleteModelGateway]
});
