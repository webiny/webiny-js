import { createImplementation } from "@webiny/feature/api";
import { AiSdkFactory as AiSdkFactoryAbstraction } from "./abstractions.js";
import type { IAiSdk, IAiSdkModel } from "./abstractions.js";

const OPENAI_MODELS: IAiSdkModel[] = [
    { id: "gpt-5.4", name: "GPT-5.4" },
    { id: "gpt-5.4-mini", name: "GPT-5.4 Mini" },
    { id: "gpt-5.4-nano", name: "GPT-5.4 Nano" },
    { id: "gpt-5.4-pro", name: "GPT-5.4 Pro" },
    { id: "gpt-5.3-chat-latest", name: "GPT-5.3 Chat" },
    { id: "gpt-4.1", name: "GPT-4.1" },
    { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
    { id: "gpt-4.1-nano", name: "GPT-4.1 Nano" },
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "o4-mini", name: "o4 Mini" },
    { id: "o3", name: "o3" }
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
