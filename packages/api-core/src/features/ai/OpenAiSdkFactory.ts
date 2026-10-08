import { createImplementation } from "@webiny/feature/api";
import { AiSdkFactory as AiSdkFactoryAbstraction } from "./abstractions.js";
import type { IAiSdk, IAiSdkModel } from "./abstractions.js";

const OPENAI_MODELS: IAiSdkModel[] = [
    { id: "gpt-6-astra", name: "GPT-6 Astra" },
    { id: "gpt-5.6-sol", name: "GPT-5.6 Sol" },
    { id: "gpt-5.6-terra", name: "GPT-5.6 Terra" },
    { id: "gpt-5.6-luna", name: "GPT-5.6 Luna" },
    { id: "gpt-5.5", name: "GPT-5.5" },
    { id: "gpt-5.5-pro", name: "GPT-5.5 Pro" },
    { id: "gpt-5.4", name: "GPT-5.4" },
    { id: "gpt-5.4-pro", name: "GPT-5.4 Pro" },
    { id: "gpt-5.4-mini", name: "GPT-5.4 Mini" },
    { id: "gpt-5.4-nano", name: "GPT-5.4 Nano" },
    { id: "gpt-5.2", name: "GPT-5.2" },
    { id: "gpt-5.2-pro", name: "GPT-5.2 Pro" },
    { id: "gpt-5", name: "GPT-5" },
    { id: "gpt-5-pro", name: "GPT-5 Pro" },
    { id: "gpt-5-mini", name: "GPT-5 Mini" },
    { id: "gpt-5-nano", name: "GPT-5 Nano" },
    { id: "gpt-4.1", name: "GPT-4.1" },
    { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    {
        id: "o3-pro",
        name: "o3 Pro",
        deprecated: new Date("2026-06-11"),
        endOfLife: new Date("2026-12-11")
    },
    {
        id: "o3",
        name: "o3",
        deprecated: new Date("2026-06-11"),
        endOfLife: new Date("2026-12-11")
    },
    {
        id: "gpt-4.1-nano",
        name: "GPT-4.1 Nano",
        deprecated: new Date("2026-04-22"),
        endOfLife: new Date("2026-10-23")
    },
    {
        id: "o4-mini",
        name: "o4 Mini",
        deprecated: new Date("2026-04-22"),
        endOfLife: new Date("2026-10-23")
    }
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
