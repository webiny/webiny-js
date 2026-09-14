import { createAbstraction } from "@webiny/feature/admin";

/**
 * Messages are opaque here on purpose. Beyond plain user/assistant turns the server also returns
 * assistant and tool messages carrying approval requests, which must be replayed VERBATIM for the
 * agent loop to resume — the request exists nowhere else, since the server keeps no session.
 */
export type AiChatMessage = { role: string; content: unknown };

/** A tool the assistant invoked, so the UI can show its work rather than just an answer. */
export interface AiChatToolCall {
    name: string;
    input: unknown;
}

/** A tool call the assistant wants to make but has not made, because it changes something. */
export interface AiChatPendingApproval {
    approvalId: string;
    toolName: string;
    title?: string;
    input: unknown;
    /** The tool declared itself destructive — the UI should say so more loudly. */
    destructive: boolean;
}

export interface AiChatDecision {
    approvalId: string;
    approved: boolean;
    reason?: string;
}

export interface AiChatRequest {
    messages: AiChatMessage[];
    /** Approve or reject calls the server paused on. */
    approvals?: AiChatDecision[];
}

/**
 * What the assistant emits while it works. Mirrors the server's `AiChatEvent`; declared here so the
 * admin bundle carries no server or AI SDK code.
 */
export type AiChatStreamEvent =
    | { type: "text"; text: string }
    | { type: "tool-call"; name: string }
    | { type: "tool-result"; name: string }
    // A tool threw. Pairs with `tool-call` by name, and does not end the run.
    | { type: "tool-error"; name: string; message: string }
    | { type: "approval"; approvals: AiChatPendingApproval[] }
    | { type: "done"; messages: AiChatMessage[]; steps: number }
    | { type: "error"; message: string };

export interface IAiChatGateway {
    /**
     * Run and yield progress as it arrives. Preferred in the UI: a multi-tool question takes tens of
     * seconds, and an approval request is worth showing the moment it appears.
     */
    stream(request: AiChatRequest, signal?: AbortSignal): AsyncIterable<AiChatStreamEvent>;
}

/** Sends a question to the server-side AI assistant (`POST /ai/chat`). */
export const AiChatGateway = createAbstraction<IAiChatGateway>("AiChatGateway");

export namespace AiChatGateway {
    export type Interface = IAiChatGateway;
    export type Message = AiChatMessage;
    export type ToolCall = AiChatToolCall;
    export type PendingApproval = AiChatPendingApproval;
    export type Decision = AiChatDecision;
    export type Request = AiChatRequest;
    export type StreamEvent = AiChatStreamEvent;
}

/**
 * One question and the answer to it, as the view needs it.
 *
 * The server messages that make a follow-up or a resumed approval work are deliberately absent: they
 * are conversation state, not something rendered, so they stay inside the presenter.
 */
export interface AiTurnViewModel {
    question: string;
    /** Answer text so far. Grows as the stream arrives. */
    text: string;
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
    pendingApprovals: AiChatPendingApproval[];
    settled: boolean;
    error?: string;
}

export interface IAiChatViewModel {
    turns: AiTurnViewModel[];
    /** A run is in flight. Asking again or deciding again is refused while true. */
    busy: boolean;
}

export interface IAiChatPresenter {
    readonly vm: IAiChatViewModel;
    /** Ask a question, carrying the settled turns before it as context. */
    ask(question: string): void;
    /** Approve or reject the calls a turn paused on, then resume it. */
    decide(turnIndex: number, approved: boolean): void;
    /** Drop the conversation and stop anything in flight. */
    reset(): void;
}

export const AiChatPresenter = createAbstraction<IAiChatPresenter>("AiChatPresenter");

export namespace AiChatPresenter {
    export type Interface = IAiChatPresenter;
    export type ViewModel = IAiChatViewModel;
    export type Turn = AiTurnViewModel;
}
