import {
    CreateModelRepository as RepositoryAbstraction,
    CreateModelGateway
} from "./abstractions.js";
import type { CreateModelParams } from "./abstractions.js";
import { ModelsCache } from "~/features/model/abstractions.js";

class CreateModelRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ModelsCache.Interface,
        private gateway: CreateModelGateway.Interface
    ) {}

    async execute(data: CreateModelParams) {
        const model = await this.gateway.execute(data);
        this.cache.addItems([model]);
        return model;
    }
}

export const CreateModelRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateModelRepositoryImpl,
    dependencies: [ModelsCache, CreateModelGateway]
});
