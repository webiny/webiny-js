import { createAbstraction } from "@webiny/feature/api";
import type { ModelMessage } from "ai";
import type { ApprovalDecision } from "./approvals.js";
import type { PendingApproval } from "./approvals.js";

export interface IAiChatConfig {
    /** Model id in `<provider>/<model>` form, e.g. "anthropic/claude-sonnet-5". */
    readonly model: string;
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

/** Which model the admin AI assistant runs on. Override to change provider or model. */
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
    /** False when no approval secret is configured, so mutating tools were withheld. */
    writesEnabled: boolean;
}

export interface IAiChatUseCase {
    execute(params: AiChatParams): Promise<AiChatResult>;
}

/** Answer a question about the project using the registered AI tools, gating writes on approval. */
export const AiChatUseCase = createAbstraction<IAiChatUseCase>("AiChatUseCase");

export namespace AiChatUseCase {
    export type Interface = IAiChatUseCase;
    export type Params = AiChatParams;
    export type Result = AiChatResult;
}
