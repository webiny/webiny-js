import React from "react";
import { Markdown } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { AiTurnViewModel } from "@webiny/app-admin";
import { ToolChip } from "./ToolChip.js";
import { AnswerSkeleton } from "./AnswerSkeleton.js";
import { ApprovalPlan } from "./ApprovalPlan.js";
import { ToolTrace } from "./ToolTrace.js";
import { UserInitials } from "./UserInitials.js";
import { toolState } from "./toolState.js";

/**
 * One of four things fills the answer slot, in priority order: the failure, the skeleton, the answer,
 * or a note that nothing came back.
 *
 * The skeleton shows only until the first token lands. Once text is arriving, the text itself is the
 * progress indicator, and swapping a skeleton in and out under it would flicker.
 *
 * A turn waiting on approval has produced no text yet and has not failed, which is not the same as
 * returning nothing, so it gets neither the note nor the skeleton.
 */
const renderAnswer = (turn: AiTurnViewModel) => {
    if (turn.error) {
        return (
            <Text as="div" size="md" className="text-destructive-primary">
                {turn.error}
            </Text>
        );
    }

    if (!turn.text && !turn.settled) {
        return <AnswerSkeleton />;
    }

    if (turn.text) {
        return (
            <Markdown size="md" className="mb-sm text-neutral-strong">
                {turn.text}
            </Markdown>
        );
    }

    if (turn.pendingApprovals.length > 0) {
        return null;
    }

    return (
        <Text as="div" size="md" className="text-neutral-muted">
            No answer returned.
        </Text>
    );
};

export interface AiTurnProps {
    turn: AiTurnViewModel;
    busy: boolean;
    onApprove: () => void;
    onReject: () => void;
}

/**
 * One question and what came back.
 *
 * While the turn is working, its tool calls show as live chips above the answer, so there is
 * something moving before the first token. Once it settles they collapse into a quiet "Ran" line
 * under the answer: still there to check, no longer competing with it. A turn waiting on approval
 * shows neither, because the plan card is the thing to read.
 */
export const AiTurn = ({ turn, busy, onApprove, onReject }: AiTurnProps) => {
    const awaitingApproval = turn.pendingApprovals.length > 0;
    const working = !turn.settled && !awaitingApproval;

    return (
        <div className="border-b border-neutral-subtle px-xxs pb-md pt-sm-plus last:border-b-0">
            <div className="flex items-start gap-sm px-sm pb-sm">
                <UserInitials />
                <Text as="div" size="md" className="font-semibold text-neutral-primary">
                    {turn.question}
                </Text>
            </div>

            <div className="px-sm">
                {working && turn.tools.length > 0 ? (
                    <div className="mb-sm-plus flex flex-wrap items-center gap-xs">
                        {turn.tools.map((name, index) => (
                            <ToolChip
                                key={`${name}-${index}`}
                                name={name}
                                state={toolState(turn, index)}
                            />
                        ))}
                    </div>
                ) : null}

                {renderAnswer(turn)}

                {awaitingApproval ? (
                    <ApprovalPlan
                        approvals={turn.pendingApprovals}
                        busy={busy}
                        onApprove={onApprove}
                        onReject={onReject}
                    />
                ) : null}

                {turn.settled && !awaitingApproval ? <ToolTrace turn={turn} /> : null}
            </div>
        </div>
    );
};
