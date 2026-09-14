import React from "react";
import { Markdown } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { AiTurnViewModel } from "@webiny/app-admin";
import { ToolChip } from "./ToolChip.js";
import { AnswerSkeleton } from "./AnswerSkeleton.js";
import { ApprovalPlan } from "./ApprovalPlan.js";

/**
 * Settled only once the tool actually returned or threw. A call awaiting approval still arrives as a
 * `tool-call`, so keying off position would show a write as completed when it has only been proposed.
 *
 * Outcomes are counted together, because a tool called twice can succeed once and fail once and the
 * chips are told apart only by their order.
 */
const toolState = (turn: AiTurnViewModel, index: number): "running" | "done" | "failed" => {
    const name = turn.tools[index];
    const callsSoFar = turn.tools.slice(0, index + 1).filter(tool => tool === name).length;
    const resultsSoFar = turn.completed.filter(tool => tool === name).length;
    const failuresSoFar = turn.failed.filter(tool => tool === name).length;

    if (resultsSoFar + failuresSoFar < callsSoFar) {
        return "running";
    }

    // The failures land last, so a call beyond the successful ones is one of them.
    return callsSoFar > resultsSoFar ? "failed" : "done";
};

export interface AiTurnProps {
    turn: AiTurnViewModel;
    /** Initials of the signed-in user, shown against their question. */
    initials: string;
    busy: boolean;
    onApprove: () => void;
    onReject: () => void;
}

export const AiTurn = ({ turn, initials, busy, onApprove, onReject }: AiTurnProps) => {
    /*
     * Show the skeleton only until the first token lands. Once text is arriving, the text itself is
     * the progress indicator — swapping a skeleton in and out under it would flicker.
     */
    const showSkeleton = !turn.text && !turn.error && !turn.settled;

    return (
        <div className="mb-md">
            <div className="flex items-start gap-sm px-sm pb-sm">
                <span className="mt-xxs grid size-md shrink-0 place-items-center rounded-xl bg-neutral-dimmed">
                    <Text size="sm" className="text-xs font-bold text-neutral-strong">
                        {initials}
                    </Text>
                </span>
                <Text as="div" size="md" className="font-semibold text-neutral-primary">
                    {turn.question}
                </Text>
            </div>

            <div className="px-sm">
                {turn.tools.length > 0 ? (
                    <div className="mb-sm flex flex-wrap items-center gap-xs">
                        {turn.tools.map((name, index) => (
                            <ToolChip
                                key={`${name}-${index}`}
                                name={name}
                                state={toolState(turn, index)}
                            />
                        ))}
                    </div>
                ) : null}

                {turn.error ? (
                    <Text as="div" size="sm" className="text-destructive-primary">
                        {turn.error}
                    </Text>
                ) : showSkeleton ? (
                    <AnswerSkeleton />
                ) : turn.text ? (
                    <Markdown size="sm" className="text-neutral-strong">
                        {turn.text}
                    </Markdown>
                ) : turn.pendingApprovals.length === 0 ? (
                    <Text as="div" size="sm" className="text-neutral-muted">
                        No answer returned.
                    </Text>
                ) : null}

                {turn.pendingApprovals.length > 0 ? (
                    <ApprovalPlan
                        approvals={turn.pendingApprovals}
                        busy={busy}
                        onApprove={onApprove}
                        onReject={onReject}
                    />
                ) : null}
            </div>
        </div>
    );
};
