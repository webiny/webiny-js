import type { AiTurnViewModel } from "@webiny/app-admin";

/**
 * Settled only once the tool actually returned or threw. A call awaiting approval still arrives as a
 * `tool-call`, so keying off position would show a write as completed when it has only been proposed.
 *
 * Outcomes are counted together, because a tool called twice can succeed once and fail once and the
 * chips are told apart only by their order.
 */
export type ToolState = "running" | "done" | "failed" | "rejected";

export const toolState = (turn: AiTurnViewModel, index: number): ToolState => {
    const name = turn.tools[index];
    const callsSoFar = turn.tools.slice(0, index + 1).filter(tool => tool === name).length;

    /*
     * A rejected call is one the run paused on, so it is among the latest calls to that tool when
     * the user decides. Counting from the end picks it out the same way failures are picked out.
     */
    const calls = turn.tools.filter(tool => tool === name).length;
    const rejected = turn.rejected.filter(tool => tool === name).length;
    if (callsSoFar > calls - rejected) {
        return "rejected";
    }

    const resultsSoFar = turn.completed.filter(tool => tool === name).length;
    const failuresSoFar = turn.failed.filter(tool => tool === name).length;

    if (resultsSoFar + failuresSoFar < callsSoFar) {
        return "running";
    }

    // The failures land last, so a call beyond the successful ones is one of them.
    return callsSoFar > resultsSoFar ? "failed" : "done";
};
