import { createAbstraction } from "@webiny/feature/api";
import type { ModelMessage } from "ai";
import type { ApprovalDecision } from "./approvals.js";
import type { AdminAssistantEvent } from "./events.js";

export interface IAdminAssistantConfig {
    /**
     * Upper bound on agent loop steps. Each tool call plus the final answer is a step, so a
     * three-tool question (list models, describe, query) needs at least four.
     */
    readonly maxSteps: number;
}

/** Runtime limits for the assistant. The model comes from its capability. */
export const AdminAssistantConfig =
    createAbstraction<IAdminAssistantConfig>("AdminAssistantConfig");

export namespace AdminAssistantConfig {
    export type Interface = IAdminAssistantConfig;
}

export interface AdminAssistantParams {
    /** Conversation so far. Replayed verbatim, since approval requests live only in these messages. */
    messages: ModelMessage[];
    /** Approve or reject tool calls a previous run paused on. */
    decisions: ApprovalDecision[];
}

export interface IAdminAssistantUseCase {
    /**
     * Run, and emit progress as it happens.
     *
     * Streaming only. A buffered `execute()` existed alongside this and nothing ever called it: a
     * multi-tool question takes tens of seconds, so every caller wants the answer as it arrives, and
     * the approval pause is worth showing the moment it appears rather than after everything
     * settles. Anything that genuinely wants the whole result can collect the events.
     */
    stream(params: AdminAssistantParams): AsyncIterable<AdminAssistantEvent>;
}

/** Answer a question about the project using the registered AI tools, gating writes on approval. */
export const AdminAssistantUseCase =
    createAbstraction<IAdminAssistantUseCase>("AdminAssistantUseCase");

export namespace AdminAssistantUseCase {
    export type Interface = IAdminAssistantUseCase;
    export type Params = AdminAssistantParams;
}
