import { AiModelRegistry as AiModelRegistryAbstraction } from "./abstractions.js";
import { AiSdkFactory } from "./abstractions.js";
import { AiModelCatalog } from "./abstractions.js";
import type { AiModel } from "./abstractions.js";

class AiModelRegistryImpl implements AiModelRegistryAbstraction.Interface {
    constructor(
        private readonly sdkFactories: AiSdkFactory.Interface[],
        private readonly catalog: AiModelCatalog.Interface
    ) {}

    async listModels(): Promise<AiModel[]> {
        const providers = await this.catalog.listProviders();

        /*
         * A provider is only offered when an SDK factory can serve it. The catalog decides its
         * models; a factory the catalog doesn't know (a custom SDK), or an unreachable catalog,
         * falls back to the factory's own list.
         */
        return this.sdkFactories.flatMap(factory => {
            const provider = providers?.find(p => p.id === factory.id);
            const providerName = provider?.name ?? factory.name;
            const models = provider?.models ?? factory.models;

            return models.map(m => ({
                providerId: factory.id,
                providerName,
                modelId: m.id,
                modelName: m.name,
                deprecated: m.deprecated,
                endOfLife: m.endOfLife
            }));
        });
    }
}

export const AiModelRegistry = AiModelRegistryAbstraction.createImplementation({
    implementation: AiModelRegistryImpl,
    dependencies: [[AiSdkFactory, { multiple: true }], AiModelCatalog]
});
