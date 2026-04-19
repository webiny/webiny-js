import { createAbstraction } from "@webiny/feature/api";
import type { generateText } from "ai";
import type { streamText } from "ai";
import type { LanguageModel } from "ai";

// AiSdk

export interface IAiSdk {
    languageModel(modelId: string): LanguageModel;
    listModels(): readonly string[];
}

/** A single AI SDK instance (e.g. OpenAI, Anthropic) that resolves model instances. */
export const AiSdk = createAbstraction<IAiSdk>("AiSdk");

export namespace AiSdk {
    export type Interface = IAiSdk;
}

// AiSdkFactory

export interface IAiSdkFactory {
    readonly name: string;
    execute(apiKey?: string): Promise<IAiSdk>;
}

/** Factory that asynchronously initialises an AI SDK. Register one per provider namespace. */
export const AiSdkFactory = createAbstraction<IAiSdkFactory>("AiSdkFactory");

export namespace AiSdkFactory {
    export type Interface = IAiSdkFactory;
}

// AiConnection

export interface IAiConnectionInline {
    readonly sdkName: string;
    readonly apiKey?: string;
}

export interface IAiConnection extends IAiConnectionInline {
    readonly id: string;
}

// AiConnectionFactory

export interface IAiConnectionFactory {
    execute(): Promise<IAiConnection>;
}

/** Factory that asynchronously produces an AiConnection. */
export const AiConnectionFactory = createAbstraction<IAiConnectionFactory>("AiConnectionFactory");

export namespace AiConnectionFactory {
    export type Interface = IAiConnectionFactory;
}

// Ai

type SDKGenerateTextParams = Parameters<typeof generateText>[0];
type SDKStreamTextParams = Parameters<typeof streamText>[0];

export type AiGenerateTextParams = Omit<SDKGenerateTextParams, "model"> & {
    model: string;
    connection?: string | IAiConnectionInline;
};
export type AiStreamTextParams = Omit<SDKStreamTextParams, "model"> & {
    model: string;
    connection?: string | IAiConnectionInline;
};

export interface IAi {
    generateText(params: AiGenerateTextParams): ReturnType<typeof generateText>;
    streamText(params: AiStreamTextParams): Promise<ReturnType<typeof streamText>>;
    listModels(connection?: string | IAiConnectionInline): Promise<string[]>;
}

/** Interact with AI language models using registered providers. */
export const Ai = createAbstraction<IAi>("Ai");

export namespace Ai {
    export type Interface = IAi;
    export type GenerateTextParams = AiGenerateTextParams;
    export type StreamTextParams = AiStreamTextParams;
}
