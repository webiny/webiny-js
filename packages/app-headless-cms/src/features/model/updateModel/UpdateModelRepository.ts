import {
    UpdateModelRepository as RepositoryAbstraction,
    UpdateModelGateway
} from "./abstractions.js";
import type { UpdateModelParams } from "./abstractions.js";
import { ModelsCache } from "~/features/model/abstractions.js";

class UpdateModelRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ModelsCache.Interface,
        private gateway: UpdateModelGateway.Interface
    ) {}

    async execute(params: UpdateModelParams) {
        const model = await this.gateway.execute(params);
        this.cache.updateItems(item => (item.modelId === model.modelId ? model : item));
        return model;
    }
}

export const UpdateModelRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateModelRepositoryImpl,
    dependencies: [ModelsCache, UpdateModelGateway]
});
