import { createAbstraction } from "@webiny/feature/admin";
import type { AiChatSaveFailure } from "~/features/aiChats/abstractions.js";
import type { AiChatsRepository } from "~/features/aiChats/abstractions.js";
import type { AssistantPageContextData } from "~/features/assistantPageContext/abstractions.js";

/**
 * A message of a saved chat. Opaque on purpose: the admin only reads them to show an opened chat,
 * and the server is the one that sends them to the model.
 */
export type AdminAssistantMessage = { role: string; content: unknown };

/** A tool the assistant invoked, so the UI can show its work rather than just an answer. */
export interface AdminAssistantToolCall {
    name: string;
    input: unknown;
}

/** A tool call the assistant wants to make but has not made, because it changes something. */
export interface AdminAssistantPendingApproval {
    approvalId: string;
    toolName: string;
    title?: string;
    input: unknown;
    /** The tool declared itself destructive — the UI should say so more loudly. */
    destructive: boolean;
}

export interface AdminAssistantDecision {
    approvalId: string;
    approved: boolean;
    reason?: string;
}

/**
 * A question, or the decisions on the calls a run paused on. The server reads the rest of the
 * conversation from the saved chat, so only its id is sent; without one, a question starts a chat.
 */
export interface AdminAssistantRequest {
    chatId?: string;
    prompt?: string;
    /** Approve or reject calls the server paused on. Needs the `chatId` of the paused run. */
    approvals?: AdminAssistantDecision[];
    /** What the user had on screen when they asked. Sent with questions only. */
    pageContext?: AssistantPageContextData;
}

/**
 * What the assistant emits while it works. Mirrors the server's `AdminAssistantEvent`; declared here so the
 * admin bundle carries no server or AI SDK code.
 */
export type AdminAssistantStreamEvent =
    // The run is going ahead, on this model ("anthropic/claude-sonnet-4-5").
    | { type: "start"; model: string }
    | { type: "text"; text: string }
    | { type: "tool-call"; name: string }
    | { type: "tool-result"; name: string }
    // A tool threw. Pairs with `tool-call` by name, and does not end the run.
    | { type: "tool-error"; name: string; message: string }
    | { type: "follow-ups"; questions: string[] }
    | { type: "approval"; approvals: AdminAssistantPendingApproval[] }
    // The run was saved, as a new chat or onto the one asked about.
    | { type: "saved"; chat: AiChatsRepository.Summary }
    // The run finished but the server could not save it. `retryable` says whether asking again could.
    | { type: "not-saved"; message: string; retryable: boolean }
    // Comes after `saved` or `not-saved`.
    | { type: "done"; steps: number }
    | { type: "error"; message: string; code?: "AI_CAPABILITY_NOT_CONFIGURED" };

export interface IAdminAssistantGateway {
    /**
     * Run and yield progress as it arrives. Preferred in the UI: a multi-tool question takes tens of
     * seconds, and an approval request is worth showing the moment it appears.
     */
    stream(
        request: AdminAssistantRequest,
        signal?: AbortSignal
    ): AsyncIterable<AdminAssistantStreamEvent>;
}

/** Sends a question to the server-side AI assistant (`POST /ai/chat`). */
export const AdminAssistantGateway =
    createAbstraction<IAdminAssistantGateway>("AdminAssistantGateway");

export namespace AdminAssistantGateway {
    export type Interface = IAdminAssistantGateway;
    export type Message = AdminAssistantMessage;
    export type ToolCall = AdminAssistantToolCall;
    export type PendingApproval = AdminAssistantPendingApproval;
    export type Decision = AdminAssistantDecision;
    export type Request = AdminAssistantRequest;
    export type StreamEvent = AdminAssistantStreamEvent;
}

/** One question and the answer to it, as the view needs it. */
export interface AiTurnViewModel {
    question: string;
    /** Answer text so far. Grows as the stream arrives. */
    text: string;
    /**
     * Where the answer proper starts in `text`: after the last tool call. Text before it is the
     * model saying what it is about to look up, which is no summary of the answer.
     */
    answerStart: number;
    /** Tools called this turn, in call order. */
    tools: string[];
    /**
     * Tools that returned. A call pending approval still emits `tool-call`, so this is the only way
     * to tell a completed tool from one merely proposed.
     */
    completed: string[];
    /** Tools that threw. Settles the chip as a failure; the run continues. */
    failed: string[];
    /** Set while a tool is running and no answer text has arrived yet. */
    running: boolean;
    pendingApprovals: AdminAssistantPendingApproval[];
    /** Questions the assistant suggests asking next. Empty until the answer is in. */
    followUps: string[];
    settled: boolean;
    error?: string;
    /**
     * The turn failed because the project has no model set up. Shown as a setup screen rather
     * than an error; `error` holds the server's reason, which names the setting to fix.
     */
    needsSetup: boolean;
}

export interface IAdminAssistantViewModel {
    turns: AiTurnViewModel[];
    /** A run is in flight. Asking again or deciding again is refused while true. */
    busy: boolean;
    /**
     * The model the last run used, fully qualified. Absent before the first run, since the admin
     * only learns it from the server.
     */
    model?: string;
    /** The saved chat this conversation is, once its first turn is saved or a chat is opened. */
    chatId: string | null;
    /** A saved chat is being read. */
    opening: boolean;
    /**
     * Why the last run was not saved, or the last open failed. The conversation on screen carries
     * on either way; this is only so the view can say it is not saved.
     */
    storageError: string | null;
    /**
     * Set when it was a run that was not saved, so the view can offer what fixes it. Null for an
     * open.
     */
    saveFailure: AiChatSaveFailure | null;
    /**
     * The newest turn needs a model set up first. No question is taken until "Try again" (`retry`)
     * succeeds, so the view can stop taking input.
     */
    setupRequired: boolean;
}

export interface IAdminAssistantPresenter {
    readonly vm: IAdminAssistantViewModel;
    /**
     * Ask a question in the chat on screen. A change still waiting on a decision is rejected.
     * Refused while `setupRequired`.
     */
    ask(question: string): void;
    /** Approve or reject the calls a turn paused on, then resume it. */
    decide(turnIndex: number, approved: boolean): void;
    /** Drop the conversation and stop anything in flight. The saved chat is kept. */
    reset(): void;
    /** Replace the conversation with a saved chat, so asking again continues it. */
    open(chatId: string): Promise<void>;
    /** Ask the newest question again, when its run failed or was not saved. */
    retry(): void;
}

export const AdminAssistantPresenter =
    createAbstraction<IAdminAssistantPresenter>("AdminAssistantPresenter");

export namespace AdminAssistantPresenter {
    export type Interface = IAdminAssistantPresenter;
    export type ViewModel = IAdminAssistantViewModel;
    export type Turn = AiTurnViewModel;
}
