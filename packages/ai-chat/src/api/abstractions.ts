import { createAbstraction } from "@webiny/feature/api";
import type { ModelMessage } from "ai";
import type { ApprovalDecision } from "./approvals.js";
import type { PendingApproval } from "./approvals.js";
import type { AiChatEvent } from "./events.js";

export interface IAiChatProviderResolution {
    /** Model id in `<provider>/<model>` form, e.g. "anthropic/claude-sonnet-5". */
    readonly model: string;
    /**
     * API key for that provider. Omit to let the provider's SDK factory fall back to its own
     * environment variable, which is what keeps local development zero-config.
     */
    readonly apiKey?: string;
}

export interface IAiChatProvider {
    resolve(): Promise<IAiChatProviderResolution>;
}

/**
 * Which model the assistant runs on, and with whose key.
 *
 * An abstraction rather than configuration because the answer differs per deployment: a project with
 * AI Power-Ups installed has providers configured in the admin UI, per tenant and encrypted at rest,
 * while a bare project has only an environment variable. The default implementation reads the
 * environment; AI Power-Ups overrides it.
 */
export const AiChatProvider = createAbstraction<IAiChatProvider>("AiChatProvider");

export namespace AiChatProvider {
    export type Interface = IAiChatProvider;
    export type Resolution = IAiChatProviderResolution;
}

export interface IAiChatConfig {
    /**
     * Upper bound on agent loop steps. Each tool call plus the final answer is a step, so a
     * three-tool question (list models, describe, query) needs at least four.
     */
    readonly maxSteps: number;
    /**
     * HMAC secret used to sign approval requests. Without it a client could replay an approval issued
     * for one tool call against a different, unshown one — so an unset secret disables write tools
     * entirely rather than degrading to an unsigned confirm.
     */
    readonly approvalSecret?: string;
}

/** Runtime limits for the assistant. The model itself comes from `AiChatProvider`. */
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

export interface AiChatResult {
    text: string;
    toolCalls: { name: string; input: unknown }[];
    steps: number;
    pendingApprovals: PendingApproval[];
    /** Response messages the caller replays when resuming after an approval. */
    messages: ModelMessage[];
    /** True when approvals are HMAC-signed, binding each to the call it was issued for. */
    approvalsSigned: boolean;
}

export interface IAiChatUseCase {
    /**
     * Run to completion and return the whole result. Used by transports that cannot stream, and by
     * hosts that just want the answer (a CLI, a background task).
     */
    execute(params: AiChatParams): Promise<AiChatResult>;
    /**
     * Run and emit progress as it happens. Same work as `execute`, reported incrementally — a
     * multi-tool question takes tens of seconds, and the approval pause is worth showing the moment
     * it arrives rather than after everything settles.
     */
    stream(params: AiChatParams): AsyncIterable<AiChatEvent>;
}

/** Answer a question about the project using the registered AI tools, gating writes on approval. */
export const AiChatUseCase = createAbstraction<IAiChatUseCase>("AiChatUseCase");

export namespace AiChatUseCase {
    export type Interface = IAiChatUseCase;
    export type Params = AiChatParams;
    export type Result = AiChatResult;
}
