import { AiModelRegistry as AiModelRegistryAbstraction } from "./abstractions.js";
import { AiSdkFactory } from "./abstractions.js";
import type { AiModel } from "./abstractions.js";

class AiModelRegistryImpl implements AiModelRegistryAbstraction.Interface {
    constructor(private readonly sdkFactories: AiSdkFactory.Interface[]) {}

    async listModels(): Promise<AiModel[]> {
        return this.sdkFactories.flatMap(factory =>
            factory.models.map(m => ({
                providerId: factory.id,
                providerName: factory.name,
                modelId: m.id,
                modelName: m.name
            }))
        );
    }
}

export const AiModelRegistry = AiModelRegistryAbstraction.createImplementation({
    implementation: AiModelRegistryImpl,
    dependencies: [[AiSdkFactory, { multiple: true }]]
});
