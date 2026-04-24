import { createAbstraction } from "@webiny/feature/api";
import type { generateText } from "ai";
import type { streamText } from "ai";
import type { LanguageModel } from "ai";
import type { FlexibleSchema, ToolSet } from "ai";

// AiSdk

export interface IAiSdkModel {
    id: string; // raw model id, e.g. "claude-sonnet-4-5"
    name: string; // human-friendly name, e.g. "Claude Sonnet 4.5"
}

export interface IAiSdk {
    languageModel(modelId: string): LanguageModel;
}

/** A single AI SDK instance (e.g. OpenAI, Anthropic) that resolves model instances. */
export const AiSdk = createAbstraction<IAiSdk>("AiSdk");

export namespace AiSdk {
    export type Interface = IAiSdk;
}

// AiSdkFactory

export interface IAiSdkFactory {
    readonly id: string; // machine id, e.g. "anthropic"
    readonly name: string; // human-friendly name, e.g. "Anthropic"
    readonly models: readonly IAiSdkModel[]; // static model list, no API call needed
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

export interface AiModel {
    providerId: string; // e.g. "anthropic"
    providerName: string; // e.g. "Anthropic"
    modelId: string; // e.g. "claude-sonnet-4-5"
    modelName: string; // e.g. "Claude Sonnet 4.5"
}

export interface IAi {
    generateText(params: AiGenerateTextParams): ReturnType<typeof generateText>;
    streamText(params: AiStreamTextParams): Promise<ReturnType<typeof streamText>>;
    listModels(): Promise<AiModel[]>;
    listModelsByConnections(): Promise<AiModel[]>;
    listModelsByConnection(connection: string | IAiConnectionInline): Promise<AiModel[]>;
}

/** Interact with AI language models using registered providers. */
export const Ai = createAbstraction<IAi>("Ai");

export namespace Ai {
    export type Interface = IAi;
    export type GenerateTextParams = AiGenerateTextParams;
    export type StreamTextParams = AiStreamTextParams;
}

// AiSdkTool

export interface IAiSdkTool<TInput = any> {
    readonly name: string;
    readonly description: string;
    readonly inputSchema: FlexibleSchema<TInput>;
    execute(input: TInput): Promise<unknown>;
}

/** A single tool that can be provided to AI generateText/streamText calls. */
export const AiSdkTool = createAbstraction<IAiSdkTool>("AiSdkTool");

export namespace AiSdkTool {
    export type Interface = IAiSdkTool;
}

// AiSdkTools

export interface IAiSdkTools {
    getToolSet(): ToolSet;
}

/** Collection of AI SDK tools. Returns a ready-to-use ToolSet for generateText/streamText. */
export const AiSdkTools = createAbstraction<IAiSdkTools>("AiSdkTools");

export namespace AiSdkTools {
    export type Interface = IAiSdkTools;
}
