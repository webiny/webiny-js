import { createImplementation } from "@webiny/feature/api";
import { AiSdkFactory as AiSdkFactoryAbstraction } from "./abstractions.js";
import type { IAiSdk } from "./abstractions.js";

const ANTHROPIC_MODELS = [
    "claude-3-haiku-20240307",
    "claude-haiku-4-5-20251001",
    "claude-haiku-4-5",
    "claude-opus-4-0",
    "claude-opus-4-20250514",
    "claude-opus-4-1-20250805",
    "claude-opus-4-1",
    "claude-opus-4-5",
    "claude-opus-4-5-20251101",
    "claude-sonnet-4-0",
    "claude-sonnet-4-20250514",
    "claude-sonnet-4-5-20250929",
    "claude-sonnet-4-5",
    "claude-sonnet-4-6",
    "claude-opus-4-6"
] as const;

class AnthropicSdkFactoryImpl implements AiSdkFactoryAbstraction.Interface {
    readonly name = "anthropic";

    async execute(apiKey?: string): Promise<IAiSdk> {
        const { createAnthropic } = await import("@ai-sdk/anthropic");
        const provider = createAnthropic({
            apiKey: apiKey ?? process.env.WEBINY_API_ANTHROPIC_API_KEY
        });
        return {
            languageModel: modelId => provider.languageModel(modelId),
            listModels: () => [...ANTHROPIC_MODELS]
        };
    }
}

export const AnthropicSdkFactory = createImplementation({
    abstraction: AiSdkFactoryAbstraction,
    implementation: AnthropicSdkFactoryImpl,
    dependencies: []
});
