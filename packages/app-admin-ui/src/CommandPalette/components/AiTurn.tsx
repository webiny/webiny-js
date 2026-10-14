import React from "react";
import { Icon, Markdown, Text } from "@webiny/admin-ui";
import { ReactComponent as ErrorIcon } from "@webiny/icons/error.svg";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import type { AiTurnViewModel } from "@webiny/app-admin";
import { ToolTrace } from "./ToolTrace.js";
import { FollowUps } from "./FollowUps.js";
import { AnswerSkeleton } from "./AnswerSkeleton.js";
import { ApprovalPlan } from "./ApprovalPlan.js";

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

/*
 * Body text, not help text. The shared `Markdown` defaults suit a sentence of field help, and an
 * answer read at that size and colour looked like a footnote. Size, colour and spacing match the AI
 * chat sidebar. Tables get rules and padding, since a list of models or entries often comes back as
 * one, and the compiler emits bare cells.
 */
const ANSWER_CLASSES = [
    "leading-[24px] text-neutral-primary",
    // About 70 characters a line. Tables and code are left full width.
    "[&_p]:mb-sm [&_p]:max-w-[70ch] [&_p]:text-pretty",
    "[&_ul]:mb-sm [&_ol]:mb-sm [&_li]:mt-xs [&_li]:max-w-[70ch]",
    "[&_table]:mb-sm [&_table]:border-collapse [&_table]:tabular-nums",
    "[&_th]:border-b [&_th]:border-neutral-dimmed [&_th]:py-xs [&_th]:pr-md [&_th]:text-left [&_th]:font-semibold",
    "[&_td]:border-b [&_td]:border-neutral-subtle [&_td]:py-xs [&_td]:pr-md",
    // In a table every row has an id; chip backgrounds on each one turn the column into noise.
    "[&_td_code]:bg-transparent [&_td_code]:px-0"
].join(" ");

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
            <Markdown size="md" className={ANSWER_CLASSES}>
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
    /** Follow-ups only make sense as the next thing to ask, so older turns drop theirs. */
    latest: boolean;
    busy: boolean;
    onApprove: () => void;
    onReject: () => void;
    onAsk: (question: string) => void;
}

/*
 * The question is a bubble on the right and the answer is plain text on the left, the same split as
 * the AI chat sidebar, so the two read as one product. The answer is marked by the assistant's
 * sparkle instead of a bubble of its own: it can hold a table or the approval card, and a box around
 * those would be a card inside a card.
 *
 * The tools it called show as one line under the answer, which stays in place while the turn runs
 * and after it settles. See `ToolTrace`.
 */
export const AiTurn = ({ turn, latest, busy, onApprove, onReject, onAsk }: AiTurnProps) => {
    const showFollowUps =
        latest && turn.settled && !turn.error && turn.pendingApprovals.length === 0;

    return (
        <div className="border-t border-neutral-subtle pt-md pb-md first:border-t-0 first:pt-xs">
            <div className="flex justify-end px-sm pb-sm">
                <Text
                    as="div"
                    size="md"
                    className="max-w-[80%] rounded-lg rounded-br-xs bg-primary-subtle px-sm-extra py-xs-plus font-semibold text-pretty text-neutral-primary"
                >
                    {turn.question}
                </Text>
            </div>

            <div className="flex items-start gap-sm px-sm">
                <Icon
                    icon={<AiIcon />}
                    size="sm"
                    label="Assistant"
                    color="accent"
                    className="mt-xs shrink-0"
                />
                <div className="min-w-0 flex-1">
                    {renderAnswer(turn)}

                    {turn.pendingApprovals.length > 0 ? (
                        <ApprovalPlan
                            approvals={turn.pendingApprovals}
                            busy={busy}
                            onApprove={onApprove}
                            onReject={onReject}
                        />
                    ) : null}

                    <ToolTrace turn={turn} />

                    {showFollowUps ? (
                        <FollowUps questions={turn.followUps} disabled={busy} onAsk={onAsk} />
                    ) : null}
                </div>
            </div>
        </div>
    );
};
