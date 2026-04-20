import { createImplementation } from "@webiny/feature/api";
import { AiSdkFactory as AiSdkFactoryAbstraction } from "./abstractions.js";
import type { IAiSdk, IAiSdkModel } from "./abstractions.js";

const ANTHROPIC_MODELS: IAiSdkModel[] = [
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5" },
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" },
    { id: "claude-opus-4-0", name: "Claude Opus 4" },
    { id: "claude-opus-4-20250514", name: "Claude Opus 4" },
    { id: "claude-opus-4-1-20250805", name: "Claude Opus 4.1" },
    { id: "claude-opus-4-1", name: "Claude Opus 4.1" },
    { id: "claude-opus-4-5", name: "Claude Opus 4.5" },
    { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5" },
    { id: "claude-sonnet-4-0", name: "Claude Sonnet 4" },
    { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" },
    { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5" },
    { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5" },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
    { id: "claude-opus-4-6", name: "Claude Opus 4.6" }
];

class AnthropicSdkFactoryImpl implements AiSdkFactoryAbstraction.Interface {
    readonly id = "anthropic";
    readonly name = "Anthropic";
    readonly models = ANTHROPIC_MODELS;

    async execute(apiKey?: string): Promise<IAiSdk> {
        const { createAnthropic } = await import("@ai-sdk/anthropic");
        const provider = createAnthropic({
            apiKey: apiKey ?? process.env.WEBINY_API_ANTHROPIC_API_KEY
        });
        return {
            languageModel: modelId => provider.languageModel(modelId)
        };
    }
}

export const AnthropicSdkFactory = createImplementation({
    abstraction: AiSdkFactoryAbstraction,
    implementation: AnthropicSdkFactoryImpl,
    dependencies: []
});
