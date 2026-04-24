import { createImplementation } from "@webiny/feature/api";
import { AiSdkFactory as AiSdkFactoryAbstraction } from "./abstractions.js";
import type { IAiSdk, IAiSdkModel } from "./abstractions.js";

// 'gpt-5' | 'gpt-5-2025-08-07' | 'gpt-5-mini' | 'gpt-5-mini-2025-08-07' | 'gpt-5-nano' | 'gpt-5-nano-2025-08-07' | 'gpt-5-chat-latest' | 'gpt-5.1' | 'gpt-5.1-2025-11-13' | 'gpt-5.1-chat-latest' | 'gpt-5.2' | 'gpt-5.2-2025-12-11' | 'gpt-5.2-chat-latest' | 'gpt-5.2-pro' | 'gpt-5.2-pro-2025-12-11' | 'gpt-5.3-chat-latest' | 'gpt-5.4' | 'gpt-5.4-2026-03-05' | 'gpt-5.4-mini' | 'gpt-5.4-mini-2026-03-17' | 'gpt-5.4-nano' | 'gpt-5.4-nano-2026-03-17' | 'gpt-5.4-pro' | 'gpt-5.4-pro-2026-03-05'

const OPENAI_MODELS: IAiSdkModel[] = [
    { id: "gpt-5", name: "GPT-5" },
    { id: "gpt-5-2025-08-07", name: "GPT-5" },
    { id: "gpt-5-chat-latest", name: "GPT-5" },
    { id: "gpt-5-mini", name: "GPT-5 Mini" },
    { id: "gpt-5-mini-2025-08-07", name: "GPT-5 Mini" },
    { id: "gpt-5-nano", name: "GPT-5 Nano" },
    { id: "gpt-5-nano-2025-08-07", name: "GPT-5 Nano" },
    { id: "gpt-5.1", name: "GPT-5.1" },
    { id: "gpt-5.1-2025-11-13", name: "GPT-5.1" },
    { id: "gpt-5.1-chat-latest", name: "GPT-5.1" },
    { id: "gpt-5.2", name: "GPT-5.2" },
    { id: "gpt-5.2-2025-12-11", name: "GPT-5.2" },
    { id: "gpt-5.2-chat-latest", name: "GPT-5.2" },
    { id: "gpt-5.2-pro", name: "GPT-5.2 Pro" },
    { id: "gpt-5.2-pro-2025-12-11", name: "GPT-5.2 Pro" },
    { id: "gpt-5.3-chat-latest", name: "GPT-5.3" },
    { id: "gpt-5.4", name: "GPT-5.4" },
    { id: "gpt-5.4-2026-03-05", name: "GPT-5.4" },
    { id: "gpt-5.4-mini", name: "GPT-5.4 Mini" },
    { id: "gpt-5.4-mini-2026-03-17", name: "GPT-5.4 Mini" },
    { id: "gpt-5.4-nano", name: "GPT-5.4 Nano" },
    { id: "gpt-5.4-nano-2026-03-17", name: "GPT-5.4 Nano" },
    { id: "gpt-5.4-pro", name: "GPT-5.4 Pro" },
    { id: "gpt-5.4-pro-2026-03-05", name: "GPT-5.4 Pro" },
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
            languageModel: modelId => provider.chat(modelId)
        };
    }
}

export const OpenAiSdkFactory = createImplementation({
    abstraction: AiSdkFactoryAbstraction,
    implementation: OpenAiSdkFactoryImpl,
    dependencies: []
});
