import type { AiTurnViewModel } from "@webiny/app-admin";

/**
 * Whether a turn has anything to put in its answer block. One that stopped at an approval before it
 * wrote or ran anything has nothing, and an empty block above the approval card reads as a missing
 * answer.
 */
export const hasAnswerBlock = (turn: AiTurnViewModel): boolean => {
    if (!turn.settled || turn.text) {
        return true;
    }
    if (turn.completed.length > 0 || turn.failed.length > 0) {
        return true;
    }
    return turn.pendingApprovals.length === 0;
};
