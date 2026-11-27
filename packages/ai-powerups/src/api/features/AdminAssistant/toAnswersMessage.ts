import type { JSONValue } from "ai";
import type { ModelMessage } from "ai";
import type { ToolApprovalResponse } from "ai";
import type { ToolContent } from "ai";
import type { ApprovalDecision } from "./approvals.js";
import type { ClientToolResult } from "./clientTools/index.js";

/**
 * Everything a paused run waits for, as the one tool message that answers it: the decisions on its
 * approvals, then the browser's results.
 *
 * One message, not one per kind. The SDK reads approval responses only from the LAST message, so a
 * results message after the decisions hid them: an approved change never ran, and its call was left
 * with no result.
 */
export const toAnswersMessage = (
    decisions: ApprovalDecision[],
    results: ClientToolResult[]
): ModelMessage => {
    const content: ToolContent = [];

    for (const decision of decisions) {
        const part: ToolApprovalResponse = {
            type: "tool-approval-response",
            approvalId: decision.approvalId,
            approved: decision.approved
        };
        if (decision.reason) {
            part.reason = decision.reason;
        }
        content.push(part);
    }

    for (const result of results) {
        const { toolCallId, toolName } = result;
        if (result.error) {
            const output = { type: "error-text" as const, value: result.error };
            content.push({ type: "tool-result", toolCallId, toolName, output });
            continue;
        }
        const parsed = result.output ?? null;
        // Parsed from JSON by `parseToolResults`, so it is a JSON value.
        const value = parsed as JSONValue;
        const output = { type: "json" as const, value };
        content.push({ type: "tool-result", toolCallId, toolName, output });
    }

    return { role: "tool", content };
};
