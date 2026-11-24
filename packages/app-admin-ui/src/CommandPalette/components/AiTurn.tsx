import React from "react";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as CollapseIcon } from "@webiny/icons/keyboard_arrow_up.svg";
import type { AiTurnViewModel } from "@webiny/app-admin";
import { AssistantSetupCard } from "./AssistantSetupCard.js";
import { AiAnswer } from "./AiAnswer.js";
import { AiQuestion } from "./AiQuestion.js";
import { ApprovalPlan } from "./ApprovalPlan.js";
import { FollowUps } from "./FollowUps.js";
import { ToolTrace } from "./ToolTrace.js";
import { TurnError } from "./TurnError.js";
import { hasAnswerBlock } from "./hasAnswerBlock.js";

export interface AiTurnProps {
    turn: AiTurnViewModel;
    initials: string;
    /** Follow-ups only make sense as the next thing to ask, so older turns drop theirs. */
    latest: boolean;
    busy: boolean;
    onApprove: () => void;
    onReject: () => void;
    onAsk: (question: string) => void;
    /** Set on an earlier turn the user opened again, so it can be shrunk back to one line. */
    onCollapse?: () => void;
    /** Asks a failed question again. Only the newest turn offers it. */
    onRetry: () => void;
    /** Opens the AI settings. Absent for someone who cannot change them. */
    onChooseModel?: () => void;
}

/*
 * One question and its answer, as a result in the palette rather than a message in a chat: the
 * question reads as a heading, the answer and the tools it ran sit under it in a grey block, and an
 * approval and what to ask next follow the block, never inside it. The palette is for a quick ask; a
 * longer conversation belongs in the chats panel.
 */
export const AiTurn = ({
    turn,
    initials,
    latest,
    busy,
    onApprove,
    onReject,
    onAsk,
    onCollapse,
    onRetry,
    onChooseModel
}: AiTurnProps) => {
    const showFollowUps =
        latest && turn.settled && !turn.error && turn.pendingApprovals.length === 0;

    let collapse: React.ReactNode = null;
    if (onCollapse) {
        // Labelled, as in the design, so it reads as an action rather than a stray arrow.
        collapse = (
            <Button
                variant="ghost"
                size="sm"
                text="Collapse"
                icon={<CollapseIcon />}
                iconPosition="end"
                aria-expanded={true}
                onClick={onCollapse}
            />
        );
    }

    return (
        <div className="flex flex-col gap-sm-extra">
            <AiQuestion initials={initials} question={turn.question} actions={collapse} />

            {turn.needsSetup ? (
                <AssistantSetupCard
                    message={turn.error ?? ""}
                    onChooseModel={onChooseModel}
                    onTryAgain={latest ? onRetry : undefined}
                />
            ) : null}

            {turn.error && !turn.needsSetup ? <TurnError message={turn.error} /> : null}

            {!turn.error && hasAnswerBlock(turn) ? (
                <div className="flex flex-col gap-sm-extra rounded-lg-plus bg-neutral-light p-md">
                    <AiAnswer turn={turn} />
                    <ToolTrace turn={turn} />
                </div>
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
        </div>
    );
};
