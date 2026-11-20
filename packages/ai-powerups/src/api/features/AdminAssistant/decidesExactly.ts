import type { ApprovalDecision } from "./approvals.js";

/**
 * Whether the decisions answer every approval still waiting, once each, and nothing else.
 *
 * A decision from an older card names an approval that was already answered, and one that leaves a
 * waiting approval out would hand the model a history the provider refuses. Either is refused
 * before the model runs.
 */
export const decidesExactly = (decisions: ApprovalDecision[], waiting: string[]): boolean => {
    const decided = new Set(decisions.map(decision => decision.approvalId));
    if (decided.size !== decisions.length || decided.size !== waiting.length) {
        return false;
    }
    return waiting.every(approvalId => decided.has(approvalId));
};
