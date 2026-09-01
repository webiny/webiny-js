import { GetModelRepository as RepositoryAbstraction, GetModelGateway } from "./abstractions.js";
import { ModelsCache } from "~/features/model/abstractions.js";
import type { IGetModelParams } from "./abstractions.js";
import type { CmsModel } from "~/types.js";

function isFullModel(model: CmsModel): boolean {
    return Array.isArray(model.layout) && model.fields.some(f => f.renderer != null);
}

class GetModelRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: ModelsCache.Interface,
        private gateway: GetModelGateway.Interface
    ) {}

    async execute(params: IGetModelParams) {
        const cached = this.cache.getItem(item => item.modelId === params.modelId);
        if (cached && isFullModel(cached)) {
            return cached;
        }

        const model = await this.gateway.execute(params);

        if (cached) {
            this.cache.updateItems(item => {
                if (item.modelId === model.modelId) {
                    return model;
                }
                return item;
            });
        }

        return model;
    }
}

export const GetModelRepository = RepositoryAbstraction.createImplementation({
    implementation: GetModelRepositoryImpl,
    dependencies: [ModelsCache, GetModelGateway]
});
