import { createAbstraction } from "@webiny/feature/api";
import type { generateText } from "ai";
import type { streamText } from "ai";
import type { LanguageModel } from "ai";

// AiProvider

export interface IAiProvider {
    languageModel(modelId: string): LanguageModel;
}

/** A single AI provider (e.g. OpenAI, Anthropic) that resolves model instances. */
export const AiProvider = createAbstraction<IAiProvider>("AiProvider");

export namespace AiProvider {
    export type Interface = IAiProvider;
}

// AiProviderFactory

export interface IAiProviderFactory {
    readonly name: string;
    execute(): Promise<IAiProvider>;
}

/** Factory that asynchronously initialises an AI provider. Register one per provider namespace. */
export const AiProviderFactory = createAbstraction<IAiProviderFactory>("AiProviderFactory");

export namespace AiProviderFactory {
    export type Interface = IAiProviderFactory;
}

// AiGateway

export interface IAiGateway {
    languageModel(modelId: string): Promise<LanguageModel>;
}

/**
 * Routes "provider/model" strings to the correct registered AI provider.
 * Model IDs use the format "<providerName>/<modelId>", e.g. "openai/gpt-4o".
 */
export const AiGateway = createAbstraction<IAiGateway>("AiGateway");

export namespace AiGateway {
    export type Interface = IAiGateway;
}

// Ai

type SDKGenerateTextParams = Parameters<typeof generateText>[0];
type SDKStreamTextParams = Parameters<typeof streamText>[0];

export type AiGenerateTextParams = Omit<SDKGenerateTextParams, "model"> & { model: string };
export type AiStreamTextParams = Omit<SDKStreamTextParams, "model"> & { model: string };

export interface IAi {
    generateText(params: AiGenerateTextParams): ReturnType<typeof generateText>;
    streamText(params: AiStreamTextParams): Promise<ReturnType<typeof streamText>>;
}

/** Interact with AI language models using registered providers. */
export const Ai = createAbstraction<IAi>("Ai");

export namespace Ai {
    export type Interface = IAi;
    export type GenerateTextParams = AiGenerateTextParams;
    export type StreamTextParams = AiStreamTextParams;
}
