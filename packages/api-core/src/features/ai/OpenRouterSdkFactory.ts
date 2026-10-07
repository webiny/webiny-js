import { createImplementation } from "@webiny/feature/api";
import { AiSdkFactory as AiSdkFactoryAbstraction } from "./abstractions.js";
import type { IAiSdk, IAiSdkModel } from "./abstractions.js";

/*
 * OpenRouter model ids carry their own vendor prefix, so the composite Webiny id has two slashes:
 * "openrouter/anthropic/claude-sonnet-5.5". `Ai` splits on the first slash only, which leaves the
 * OpenRouter id intact.
 */
const OPENROUTER_MODELS: IAiSdkModel[] = [
    { id: "mistralai/mistral-large-4-0", name: "Mistral: Mistral Large 4" },
    { id: "openai/gpt-6.1-sol", name: "OpenAI: GPT-6.1 Sol" },
    { id: "anthropic/claude-sonnet-5.5", name: "Anthropic: Claude Sonnet 5.5" },
    { id: "qwen/qwen3.8-max-prime", name: "Qwen: Qwen3.8 Max Prime" },
    { id: "z-ai/glm-5.3-prime", name: "Z.ai: GLM 5.3 Prime" },
    { id: "openai/gpt-6-sol", name: "OpenAI: GPT-6 Sol" },
    { id: "openai/gpt-6-luna", name: "OpenAI: GPT-6 Luna" },
    { id: "anthropic/claude-opus-5.5", name: "Anthropic: Claude Opus 5.5" },
    { id: "x-ai/grok-4.7", name: "SpaceXAI: Grok 4.7" },
    { id: "deepseek/deepseek-v4.1-flash", name: "DeepSeek: DeepSeek V4.1 Flash" },
    { id: "openai/gpt-6-astra", name: "OpenAI: GPT-6 Astra" },
    { id: "google/gemini-3.8-flash", name: "Google: Gemini 3.8 Flash" },
    { id: "anthropic/claude-fable-5.1", name: "Anthropic: Claude Fable 5.1" },
    { id: "anthropic/claude-opus-5", name: "Anthropic: Claude Opus 5" },
    { id: "google/gemini-3.5-flash-lite", name: "Google: Gemini 3.5 Flash Lite" },
    { id: "moonshotai/kimi-k3", name: "MoonshotAI: Kimi K3" },
    { id: "openai/gpt-5.6-terra", name: "OpenAI: GPT-5.6 Terra" },
    { id: "anthropic/claude-sonnet-5", name: "Anthropic: Claude Sonnet 5" },
    { id: "openai/gpt-5.4-mini", name: "OpenAI: GPT-5.4 Mini" },
    { id: "anthropic/claude-haiku-4.5", name: "Anthropic: Claude Haiku 4.5" },
    { id: "google/gemini-2.5-pro", name: "Google: Gemini 2.5 Pro" }
];

class OpenRouterSdkFactoryImpl implements AiSdkFactoryAbstraction.Interface {
    readonly id = "openrouter";
    readonly name = "OpenRouter";
    readonly models = OPENROUTER_MODELS;

    async execute(apiKey?: string): Promise<IAiSdk> {
        const { createOpenRouter } = await import("@openrouter/ai-sdk-provider");
        const provider = createOpenRouter({
            apiKey: apiKey ?? process.env.WEBINY_API_OPENROUTER_API_KEY
        });
        return {
            languageModel: modelId => provider.chat(modelId)
        };
    }
}

export const OpenRouterSdkFactory = createImplementation({
    abstraction: AiSdkFactoryAbstraction,
    implementation: OpenRouterSdkFactoryImpl,
    dependencies: []
});
