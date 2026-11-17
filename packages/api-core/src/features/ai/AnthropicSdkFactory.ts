import { createImplementation } from "@webiny/feature/api";
import { AiSdkFactory as AiSdkFactoryAbstraction } from "./abstractions.js";
import type { IAiSdk, IAiSdkModel } from "./abstractions.js";
import { requireApiKey } from "./requireApiKey.js";

const ANTHROPIC_MODELS: IAiSdkModel[] = [
    { id: "claude-fable-5-1", name: "Claude Fable 5.1" },
    { id: "claude-opus-5", name: "Claude Opus 5" },
    { id: "claude-sonnet-5", name: "Claude Sonnet 5" },
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" },
    { id: "claude-fable-5", name: "Claude Fable 5" },
    { id: "claude-opus-4-8", name: "Claude Opus 4.8" },
    { id: "claude-opus-4-7", name: "Claude Opus 4.7" },
    { id: "claude-opus-4-6", name: "Claude Opus 4.6" },
    { id: "claude-opus-4-5", name: "Claude Opus 4.5" },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6" },
    { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5" }
];

class AnthropicSdkFactoryImpl implements AiSdkFactoryAbstraction.Interface {
    readonly id = "anthropic";
    readonly name = "Anthropic";
    readonly models = ANTHROPIC_MODELS;

    async execute(apiKey?: string): Promise<IAiSdk> {
        const { createAnthropic } = await import("@ai-sdk/anthropic");
        const provider = createAnthropic({
            apiKey: requireApiKey(this.name, apiKey),
            // Set explicitly, or the SDK reads ANTHROPIC_BASE_URL and sends the key there.
            baseURL: "https://api.anthropic.com/v1"
        });
        return {
            languageModel: modelId => provider.chat(modelId)
        };
    }
}

export const AnthropicSdkFactory = createImplementation({
    abstraction: AiSdkFactoryAbstraction,
    implementation: AnthropicSdkFactoryImpl,
    dependencies: []
});
