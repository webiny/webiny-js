import {
    CloneModelRepository as RepositoryAbstraction,
    CloneModelGateway
} from "./abstractions.js";
import type { CloneModelParams } from "./abstractions.js";
import { ModelsCache } from "~/features/model/abstractions.js";

class CloneModelRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ModelsCache.Interface,
        private gateway: CloneModelGateway.Interface
    ) {}

    async execute(params: CloneModelParams) {
        const model = await this.gateway.execute(params);
        this.cache.addItems([model]);
        return model;
    }
}

export const CloneModelRepository = RepositoryAbstraction.createImplementation({
    implementation: CloneModelRepositoryImpl,
    dependencies: [ModelsCache, CloneModelGateway]
});
