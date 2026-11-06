import React from "react";
import type { AiTurnViewModel } from "@webiny/app-admin";
import { AiAnswer } from "~/CommandPalette/components/index.js";
import { ApprovalPlan } from "~/CommandPalette/components/index.js";
import { FollowUps } from "~/CommandPalette/components/index.js";
import { ToolTrace } from "~/CommandPalette/components/index.js";
import { TurnError } from "~/CommandPalette/components/index.js";
import { hasAnswerBlock } from "~/CommandPalette/components/index.js";
import { InsightCard } from "./InsightCard.js";

export interface ChatTurnProps {
    turn: AiTurnViewModel;
    /** Follow-ups only make sense as the next thing to ask, so older turns drop theirs. */
    latest: boolean;
    busy: boolean;
    onApprove: () => void;
    onReject: () => void;
    onAsk: (question: string) => void;
}

/**
 * One question and its answer, as messages in a chat: the question in a bubble on the right under
 * "You", the answer in an insight card. The answer itself renders as it does in the palette, and the
 * approval and follow-ups go under the card, never inside it.
 */
export const ChatTurn = ({ turn, latest, busy, onApprove, onReject, onAsk }: ChatTurnProps) => {
    const showFollowUps =
        latest && turn.settled && !turn.error && turn.pendingApprovals.length === 0;

    return (
        <>
            <div className="flex flex-col items-end gap-xs">
                <span className="text-sm text-neutral-strong">You</span>
                <div className="max-w-[85%] whitespace-pre-wrap rounded-lg-plus bg-neutral-light px-md py-sm-extra text-md text-neutral-primary">
                    {turn.question}
                </div>
            </div>

            {turn.error ? <TurnError message={turn.error} /> : null}

            {!turn.error && hasAnswerBlock(turn) ? (
                // Copy waits for the answer to finish, so it never copies half of one.
                <InsightCard copyText={turn.settled && turn.text ? turn.text : undefined}>
                    <AiAnswer turn={turn} />
                    <ToolTrace turn={turn} />
                </InsightCard>
            ) : null}

            {turn.pendingApprovals.length > 0 ? (
                <ApprovalPlan
                    approvals={turn.pendingApprovals}
                    busy={busy}
                    onApprove={onApprove}
                    onReject={onReject}
                />
            ) : null}

            {showFollowUps ? (
                <FollowUps questions={turn.followUps} disabled={busy} onAsk={onAsk} />
            ) : null}
        </>
    );
};
