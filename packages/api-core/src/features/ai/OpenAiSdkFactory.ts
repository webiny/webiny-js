import { createImplementation } from "@webiny/feature/api";
import { AiSdkFactory as AiSdkFactoryAbstraction } from "./abstractions.js";
import type { IAiSdk, IAiSdkModel } from "./abstractions.js";

const OPENAI_MODELS: IAiSdkModel[] = [
    { id: "gpt-4.1", name: "GPT-4.1" },
    { id: "gpt-4.1-2025-04-14", name: "GPT-4.1" },
    { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
    { id: "gpt-4.1-mini-2025-04-14", name: "GPT-4.1 Mini" },
    { id: "gpt-4.1-nano", name: "GPT-4.1 Nano" },
    { id: "gpt-4.1-nano-2025-04-14", name: "GPT-4.1 Nano" },
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-2024-05-13", name: "GPT-4o" },
    { id: "gpt-4o-2024-08-06", name: "GPT-4o" },
    { id: "gpt-4o-2024-11-20", name: "GPT-4o" },
    { id: "gpt-4o-audio-preview", name: "GPT-4o Audio Preview" },
    { id: "gpt-4o-audio-preview-2024-12-17", name: "GPT-4o Audio Preview" },
    { id: "gpt-4o-search-preview", name: "GPT-4o Search Preview" },
    { id: "gpt-4o-search-preview-2025-03-11", name: "GPT-4o Search Preview" },
    { id: "gpt-4o-mini-search-preview", name: "GPT-4o Mini Search Preview" },
    { id: "gpt-4o-mini-search-preview-2025-03-11", name: "GPT-4o Mini Search Preview" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "gpt-4o-mini-2024-07-18", name: "GPT-4o Mini" },
    { id: "gpt-3.5-turbo-0125", name: "GPT-3.5 Turbo" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
    { id: "gpt-3.5-turbo-1106", name: "GPT-3.5 Turbo" },
    { id: "o1", name: "o1" },
    { id: "o1-2024-12-17", name: "o1" },
    { id: "o3", name: "o3" },
    { id: "o3-2025-04-16", name: "o3" },
    { id: "o3-mini", name: "o3 Mini" },
    { id: "o3-mini-2025-01-31", name: "o3 Mini" },
    { id: "o4-mini", name: "o4 Mini" },
    { id: "o4-mini-2025-04-16", name: "o4 Mini" }
];

class OpenAiSdkFactoryImpl implements AiSdkFactoryAbstraction.Interface {
    readonly id = "openai";
    readonly name = "OpenAI";
    readonly models = OPENAI_MODELS;

    async execute(apiKey?: string): Promise<IAiSdk> {
        const { createOpenAI } = await import("@ai-sdk/openai");
        const provider = createOpenAI({
            apiKey: apiKey ?? process.env.WEBINY_API_OPENAI_API_KEY
        });
        return {
            languageModel: modelId => provider.languageModel(modelId)
        };
    }
}

export const OpenAiSdkFactory = createImplementation({
    abstraction: AiSdkFactoryAbstraction,
    implementation: OpenAiSdkFactoryImpl,
    dependencies: []
});
