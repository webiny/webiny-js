import { createImplementation } from "@webiny/feature/api";
import type { LanguageModel } from "ai";
import { AiGateway as AiGatewayAbstraction } from "./abstractions.js";
import { AiProviderFactory } from "./abstractions.js";
import type { IAiProvider } from "./abstractions.js";

class AiGatewayImpl implements AiGatewayAbstraction.Interface {
    private providerMap: Map<string, IAiProvider> | null = null;

    constructor(private readonly factories: AiProviderFactory.Interface[]) {}

    async languageModel(modelId: string): Promise<LanguageModel> {
        const providers = await this.getProviderMap();

        const slashIndex = modelId.indexOf("/");
        if (slashIndex === -1) {
            throw new Error(
                `Invalid model ID "${modelId}". Expected format: "<provider>/<modelId>" (e.g. "openai/gpt-4o").`
            );
        }

        const providerName = modelId.slice(0, slashIndex);
        const modelName = modelId.slice(slashIndex + 1);

        const provider = providers.get(providerName);
        if (!provider) {
            const registered = [...providers.keys()].join('", "');
            throw new Error(
                `Unknown AI provider "${providerName}". Registered providers: "${registered}".`
            );
        }

        return provider.languageModel(modelName);
    }

    private async getProviderMap(): Promise<Map<string, IAiProvider>> {
        if (!this.providerMap) {
            const results = await Promise.all(
                this.factories.map(async factory => ({
                    name: factory.name,
                    provider: await factory.execute()
                }))
            );
            this.providerMap = new Map(results.map(({ name, provider }) => [name, provider]));
        }
        return this.providerMap;
    }
}

export const AiGateway = createImplementation({
    abstraction: AiGatewayAbstraction,
    implementation: AiGatewayImpl,
    dependencies: [[AiProviderFactory, { multiple: true }]]
});
