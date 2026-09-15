import { createAbstraction } from "@webiny/feature/api";
import type { Constructor } from "@webiny/di";
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

/**
 * Behavioural hints about a tool. Purely advisory — they never replace a permission check.
 * Names mirror the MCP tool annotations so they can be forwarded verbatim to MCP clients,
 * which use them to decide what to auto-approve and what to confirm with the user.
 */
export interface IAiSdkToolAnnotations {
    /** Tool does not modify state. */
    readOnlyHint?: boolean;
    /** Tool may perform destructive updates (only meaningful when not read-only). */
    destructiveHint?: boolean;
    /** Repeated calls with the same arguments have no additional effect. */
    idempotentHint?: boolean;
    /** Tool interacts with entities outside its own closed world. */
    openWorldHint?: boolean;
}

/**
 * What a tool IS: everything the model is told about it, with no behaviour and no dependencies.
 *
 * Building the tool set, listing tools and deciding which ones need approval all read only this.
 * Keeping it dependency-free is the point — every consumer injects the whole set, so anything
 * expensive here is paid for all of them by anyone who touches one.
 */
export interface IAiSdkToolMetadata<TInput = any> {
    readonly name: string;
    readonly description: string;
    readonly inputSchema: FlexibleSchema<TInput>;
    /** Human-friendly display name. Falls back to `name` when omitted. */
    readonly title?: string;
    readonly annotations?: IAiSdkToolAnnotations;
}

/**
 * What a tool DOES. This is the half that injects use cases, so it is built only for a tool the
 * model actually calls, and only at the moment it calls it.
 */
export interface IAiSdkToolHandler<TInput = any> {
    execute(input: TInput): Promise<unknown>;
}

/**
 * A single tool that can be provided to AI generateText/streamText calls.
 *
 * TRANSITIONAL SHAPE. A tool supplies its behaviour in one of two ways:
 *
 *  - the new way: `handler` names an {@link IAiSdkToolHandler} class, built only when the tool runs;
 *  - the old way: the tool implements `execute` itself, which forces every tool (and every use case
 *    it injects) to be built merely to read the name and schema of the others.
 *
 * `execute` is optional ONLY to let both shapes coexist while packages migrate. Exactly one of
 * `execute` or `handler` must be present; a tool with neither fails with
 * {@link AiSdkToolNotExecutableError} when called.
 *
 * NOT called `AiSdkToolDefinition`, unlike `HttpRouteDefinition`. Two reasons: while `execute` is
 * still allowed here this is a tool that MAY carry its own behaviour, not a pure definition; and
 * `AiSdkTool` is the registered abstraction every extension declares against and `resolveAll` reads,
 * so renaming it would break that for nothing. Routes could take the new name because their handler
 * kept the original `IHttpRoute` interface, leaving the definition as the genuinely new thing.
 */
export interface IAiSdkTool<TInput = any>
    extends IAiSdkToolMetadata<TInput>, Partial<IAiSdkToolHandler<TInput>> {
    readonly handler?: Constructor<IAiSdkToolHandler<TInput>>;
}

export const AiSdkTool = createAbstraction<IAiSdkTool>("AiSdkTool");

/**
 * The behaviour half of a tool, built on demand through {@link AiSdkToolHandlerResolver}.
 *
 * Implementations are NOT registered against this abstraction. The tool points at the class
 * directly, exactly as `HttpRouteDefinition` points at its `HttpRouteHandler`. Declaring them
 * through it is what attaches their dependency metadata.
 */
export const AiSdkToolHandler = createAbstraction<IAiSdkToolHandler>("AiSdkToolHandler");

export namespace AiSdkTool {
    export type Interface<TInput = any> = IAiSdkTool<TInput>;
    export type Metadata<TInput = any> = IAiSdkToolMetadata<TInput>;
    export type Annotations = IAiSdkToolAnnotations;
}

export namespace AiSdkToolHandler {
    export type Interface<TInput = any> = IAiSdkToolHandler<TInput>;
}

// AiSdkToolHandlerResolver

export interface IAiSdkToolHandlerResolver {
    resolve<TInput>(handler: Constructor<IAiSdkToolHandler<TInput>>): IAiSdkToolHandler<TInput>;
}

/**
 * Builds the behaviour half of a tool on demand.
 *
 * Something has to turn `tool.handler` (a class) into an instance, and that needs the container.
 * Rather than injecting the container into the tool registry, it lives behind this one narrow
 * abstraction, so everything else depends on `resolve(handler)` and stays testable with a stub.
 */
export const AiSdkToolHandlerResolver = createAbstraction<IAiSdkToolHandlerResolver>(
    "AiSdkToolHandlerResolver"
);

export namespace AiSdkToolHandlerResolver {
    export type Interface = IAiSdkToolHandlerResolver;
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
