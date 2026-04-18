import { createImplementation } from "@webiny/feature/api";
import { AiSdkFactory as AiSdkFactoryAbstraction } from "./abstractions.js";
import type { IAiSdk } from "./abstractions.js";

const OPENAI_MODELS = [
    "gpt-4.1",
    "gpt-4.1-2025-04-14",
    "gpt-4.1-mini",
    "gpt-4.1-mini-2025-04-14",
    "gpt-4.1-nano",
    "gpt-4.1-nano-2025-04-14",
    "gpt-4o",
    "gpt-4o-2024-05-13",
    "gpt-4o-2024-08-06",
    "gpt-4o-2024-11-20",
    "gpt-4o-audio-preview",
    "gpt-4o-audio-preview-2024-12-17",
    "gpt-4o-search-preview",
    "gpt-4o-search-preview-2025-03-11",
    "gpt-4o-mini-search-preview",
    "gpt-4o-mini-search-preview-2025-03-11",
    "gpt-4o-mini",
    "gpt-4o-mini-2024-07-18",
    "gpt-3.5-turbo-0125",
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-1106",
    "o1",
    "o1-2024-12-17",
    "o3",
    "o3-2025-04-16",
    "o3-mini",
    "o3-mini-2025-01-31",
    "o4-mini",
    "o4-mini-2025-04-16"
] as const;

class OpenAiSdkFactoryImpl implements AiSdkFactoryAbstraction.Interface {
    readonly name = "openai";

    async execute(apiKey?: string): Promise<IAiSdk> {
        const { createOpenAI } = await import("@ai-sdk/openai");
        const provider = createOpenAI({
            apiKey: apiKey ?? process.env.WEBINY_API_OPENAI_API_KEY
        });
        return {
            languageModel: modelId => provider.languageModel(modelId),
            listModels: () => [...OPENAI_MODELS]
        };
    }
}

export const OpenAiSdkFactory = createImplementation({
    abstraction: AiSdkFactoryAbstraction,
    implementation: OpenAiSdkFactoryImpl,
    dependencies: []
});
