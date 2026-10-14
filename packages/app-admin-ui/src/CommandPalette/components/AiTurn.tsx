import React from "react";
import { Icon, Markdown, Text } from "@webiny/admin-ui";
import { ReactComponent as ErrorIcon } from "@webiny/icons/error.svg";
import type { AiTurnViewModel } from "@webiny/app-admin";
import { ToolChip } from "./ToolChip.js";
import { ToolTrace } from "./ToolTrace.js";
import { FollowUps } from "./FollowUps.js";
import { AnswerSkeleton } from "./AnswerSkeleton.js";
import { ApprovalPlan } from "./ApprovalPlan.js";
import { toolState } from "./toolState.js";

/**
 * Its own block rather than red text, so a failure reads as the outcome of the turn and not as part
 * of an answer. Most messages here name the setting to fix, so they are shown as sent.
 */
const AnswerError = ({ message }: { message: string }) => (
    <div className="flex items-start gap-sm rounded-md border border-destructive-subtle bg-destructive-subtle px-sm py-xs-plus">
        <Icon
            icon={<ErrorIcon />}
            size="sm"
            label=""
            color="inherit"
            className="mt-xxs text-destructive-primary"
        />
        <Text as="div" size="sm" className="text-neutral-primary">
            {message}
        </Text>
    </div>
);

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
        return <AnswerError message={turn.error} />;
    }

    if (!turn.text && !turn.settled) {
        return <AnswerSkeleton />;
    }

    if (turn.text) {
        return (
            <Markdown size="sm" className="text-neutral-strong">
                {turn.text}
            </Markdown>
        );
    }

    if (turn.pendingApprovals.length > 0) {
        return null;
    }

    return (
        <Text as="div" size="sm" className="text-neutral-muted">
            No answer returned.
        </Text>
    );
};

export interface AiTurnProps {
    turn: AiTurnViewModel;
    busy: boolean;
    onApprove: () => void;
    onReject: () => void;
    onAsk: (question: string) => void;
}

/*
 * The question is a bubble on the right and the answer is plain text on the left, the same split as
 * the AI chat sidebar, so the two read as one product. A bubble also tells the user's words from the
 * assistant's at a glance, which an avatar beside a left-aligned question did not.
 *
 * Tools show in two places, never both. While the turn runs, chips above the answer show the work in
 * progress. Once it settles, they fold into one "Ran" line under it.
 */
export const AiTurn = ({ turn, busy, onApprove, onReject, onAsk }: AiTurnProps) => {
    const showLiveTools = !turn.settled && turn.tools.length > 0;
    const showFollowUps = turn.settled && !turn.error && turn.pendingApprovals.length === 0;

    return (
        <div className="mb-md">
            <div className="flex justify-end px-sm pb-sm">
                <Text
                    as="div"
                    size="md"
                    className="max-w-[80%] rounded-lg bg-primary-subtle px-sm-extra py-xs-plus font-semibold text-neutral-primary"
                >
                    {turn.question}
                </Text>
            </div>

            <div className="px-sm">
                {showLiveTools ? (
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

                {renderAnswer(turn)}

                {turn.pendingApprovals.length > 0 ? (
                    <ApprovalPlan
                        approvals={turn.pendingApprovals}
                        busy={busy}
                        onApprove={onApprove}
                        onReject={onReject}
                    />
                ) : null}

                {turn.settled ? <ToolTrace turn={turn} /> : null}

                {showFollowUps ? (
                    <FollowUps questions={turn.followUps} disabled={busy} onAsk={onAsk} />
                ) : null}
            </div>
        </div>
    );
};
