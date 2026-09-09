import { createImplementation } from "@webiny/feature/api";
import { AiSdkFactory as AiSdkFactoryAbstraction } from "./abstractions.js";
import type { IAiSdk, IAiSdkModel } from "./abstractions.js";

const GOOGLE_MODELS: IAiSdkModel[] = [
    { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash" },
    { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash" },
    { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash" },
    { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash" },
    { id: "gemini-3.5-flash-lite", name: "Gemini 3.5 Flash Lite" },
    { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite" }
];

class GoogleSdkFactoryImpl implements AiSdkFactoryAbstraction.Interface {
    readonly id = "google";
    readonly name = "Google";
    readonly models = GOOGLE_MODELS;

    async execute(apiKey?: string): Promise<IAiSdk> {
        const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
        const provider = createGoogleGenerativeAI({
            apiKey: apiKey ?? process.env.WEBINY_API_GOOGLE_API_KEY
        });
        return {
            languageModel: modelId => provider.chat(modelId)
        };
    }
}

export const GoogleSdkFactory = createImplementation({
    abstraction: AiSdkFactoryAbstraction,
    implementation: GoogleSdkFactoryImpl,
    dependencies: []
});
