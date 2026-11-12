import type { ModelMessage } from "ai";

interface ApprovalPart {
    type?: unknown;
    approvalId?: unknown;
}

const partsOf = (message: ModelMessage): ApprovalPart[] => {
    return Array.isArray(message.content) ? (message.content as ApprovalPart[]) : [];
};

/**
 * Approval requests in a saved chat that no response answers yet, in the order they were made.
 *
 * A run that paused on an approval is saved paused, so the decision can resume it from storage. Its
 * assistant message carries a `tool-approval-request` per proposed call, and the decision arrives
 * later as a `tool-approval-response` with the same id.
 */
export const unansweredApprovals = (messages: ModelMessage[]): string[] => {
    const requested: string[] = [];
    const answered = new Set<string>();

    for (const message of messages) {
        for (const part of partsOf(message)) {
            if (typeof part.approvalId !== "string") {
                continue;
            }
            if (part.type === "tool-approval-request") {
                requested.push(part.approvalId);
            }
            if (part.type === "tool-approval-response") {
                answered.add(part.approvalId);
            }
        }
    }

    return requested.filter(id => !answered.has(id));
};
