import { createAbstraction } from "@webiny/feature/api";
import type { ApprovalDecision } from "./approvals.js";
import type { AdminAssistantEvent } from "./events.js";
import type { AdminAssistantPageContext } from "./pageContext.js";

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

/**
 * A question, or a decision on a paused one. The conversation so far is read from the saved chat
 * rather than sent, so a request stays the same size however long the chat gets.
 */
export interface AdminAssistantParams {
    /** The saved chat to continue. Omitted for a new chat, which the run creates. */
    chatId?: string;
    /** The new question. Absent when the request only decides on a paused run. */
    prompt?: string;
    /** Approve or reject tool calls the chat's last run paused on. */
    decisions: ApprovalDecision[];
    /** What the user had on screen when they asked. Absent when the view says nothing. */
    pageContext?: AdminAssistantPageContext;
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
    export type PageContext = AdminAssistantPageContext;
}
