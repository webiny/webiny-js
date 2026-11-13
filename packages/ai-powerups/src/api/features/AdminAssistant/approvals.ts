import { AiSdkToolDefinition } from "@webiny/api-core/features/ai/index.js";

/**
 * A tool call the assistant wants to make but has not made, because it mutates something.
 * Returned to the client so a human can approve or reject it.
 */
export interface PendingApproval {
    approvalId: string;
    toolName: string;
    /** Human-readable tool name where the tool supplied one. */
    title?: string;
    input: unknown;
    /** True when the tool declared `destructiveHint` — the UI should say so louder. */
    destructive: boolean;
}

export interface ApprovalDecision {
    approvalId: string;
    approved: boolean;
    reason?: string;
}

export const toPendingApproval = (
    approvalId: string,
    toolName: string,
    input: unknown,
    tools: AiSdkToolDefinition.Interface[]
): PendingApproval => {
    const tool = tools.find(candidate => candidate.name === toolName);

    return {
        approvalId,
        toolName,
        title: tool?.title,
        input,
        destructive: tool?.annotations?.destructiveHint === true
    };
};

export const parseDecisions = (value: unknown): ApprovalDecision[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap(entry => {
        if (!entry || typeof entry !== "object") {
            return [];
        }
        const { approvalId, approved, reason } = entry as Record<string, unknown>;
        if (typeof approvalId !== "string" || typeof approved !== "boolean") {
            return [];
        }
        const decision: ApprovalDecision = { approvalId, approved };

        if (typeof reason === "string") {
            decision.reason = reason;
        }

        return [decision];
    });
};
