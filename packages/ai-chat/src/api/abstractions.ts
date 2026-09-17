import { createAbstraction } from "@webiny/feature/api";
import type { ModelMessage } from "ai";
import type { ApprovalDecision } from "./approvals.js";
import type { AiChatEvent } from "./events.js";

/**
 * Everything a chat run needs that comes from configuration rather than from the request.
 *
 * All of it comes from AI Power-Ups settings. There is no environment-variable path and no built-in
 * default model: a project configures the assistant where it configures every other AI feature, and
 * `ResolveAiCapabilityUseCase` is the one place that decides what those settings mean.
 */
export interface IAiChatResolution {
    /** Model id in `<vendor>/<model>` form, e.g. "anthropic/claude-sonnet-5". */
    readonly model: string;
    /**
     * Which vendor SDK runs it, and with whose key.
     *
     * Shaped like `Ai.GenerateTextParams["connection"]` so it is passed straight through. `sdkName`
     * travels rather than being re-derived from `model` downstream, because the resolver has
     * already checked the model's vendor against the credential's and that checked answer is the
     * one worth using.
     */
    readonly connection: {
        readonly sdkName: string;
        readonly apiKey: string;
    };
    /**
     * What the assistant is told about its job.
     *
     * Resolved here rather than read straight from `SYSTEM_PROMPT` because a project can append to
     * it: AI Power-Ups exposes the assistant as a capability, and a capability carries the project's
     * additional instructions alongside the model it runs on. Both come from the same settings
     * record, so resolving them together is one read instead of two.
     */
    readonly systemPrompt: string;
}

export interface IAiChatResolver {
    resolve(): Promise<IAiChatResolution>;
}

/**
 * Which model the assistant runs on, and with whose key.
 *
 * An abstraction rather than configuration because the answer differs per deployment: a project with
 * AI Power-Ups installed has providers configured in the admin UI, per tenant and encrypted at rest,
 * while a bare project has only an environment variable. The default implementation reads the
 * environment; AI Power-Ups overrides it.
 */
export const AiChatResolver = createAbstraction<IAiChatResolver>("AiChatResolver");

export namespace AiChatResolver {
    export type Interface = IAiChatResolver;
    export type Resolution = IAiChatResolution;
}

export interface IAiChatConfig {
    /**
     * Upper bound on agent loop steps. Each tool call plus the final answer is a step, so a
     * three-tool question (list models, describe, query) needs at least four.
     */
    readonly maxSteps: number;
}

/** Runtime limits for the assistant. The model itself comes from `AiChatResolver`. */
export const AiChatConfig = createAbstraction<IAiChatConfig>("AiChatConfig");

export namespace AiChatConfig {
    export type Interface = IAiChatConfig;
}

export interface AiChatParams {
    /** Conversation so far. Replayed verbatim, since approval requests live only in these messages. */
    messages: ModelMessage[];
    /** Approve or reject tool calls a previous run paused on. */
    decisions: ApprovalDecision[];
}

export interface IAiChatUseCase {
    /**
     * Run, and emit progress as it happens.
     *
     * Streaming only. A buffered `execute()` existed alongside this and nothing ever called it: a
     * multi-tool question takes tens of seconds, so every caller wants the answer as it arrives, and
     * the approval pause is worth showing the moment it appears rather than after everything
     * settles. Anything that genuinely wants the whole result can collect the events.
     */
    stream(params: AiChatParams): AsyncIterable<AiChatEvent>;
}

/** Answer a question about the project using the registered AI tools, gating writes on approval. */
export const AiChatUseCase = createAbstraction<IAiChatUseCase>("AiChatUseCase");

export namespace AiChatUseCase {
    export type Interface = IAiChatUseCase;
    export type Params = AiChatParams;
}
