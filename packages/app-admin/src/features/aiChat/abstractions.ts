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

export interface AiChatResult {
    text: string;
    toolCalls: AiChatToolCall[];
    steps: number;
    pendingApprovals: AiChatPendingApproval[];
    /** Server response messages, replayed unchanged when resuming after an approval. */
    messages: AiChatMessage[];
    /** False when the server has no approval secret configured, so writes are withheld entirely. */
    writesEnabled: boolean;
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
    | { type: "approval"; approvals: AiChatPendingApproval[] }
    | { type: "done"; messages: AiChatMessage[]; steps: number; writesEnabled: boolean }
    | { type: "error"; message: string };

export interface IAiChatGateway {
    /** Run to completion and return the whole result. */
    execute(request: AiChatRequest): Promise<AiChatResult>;
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
    export type Result = AiChatResult;
    export type StreamEvent = AiChatStreamEvent;
}
