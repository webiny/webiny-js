import React from "react";
import { Icon } from "@webiny/admin-ui";
import { Markdown } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
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
 *
 * The answer box is `neutral-light`, a shade darker than the shared defaults' inline code and light
 * rules, so both step darker here to stay visible on it.
 */
const ANSWER_CLASSES = [
    "leading-[24px] text-neutral-primary",
    // About 70 characters a line. Tables and code are left full width.
    "[&_p]:mb-sm [&_p]:max-w-[70ch] [&_p]:text-pretty [&>*:last-child]:mb-0",
    "[&_ul]:mb-sm [&_ol]:mb-sm [&_li]:mt-xs [&_li]:max-w-[70ch]",
    "[&_table]:mb-sm [&_table]:border-collapse [&_table]:tabular-nums",
    "[&_th]:border-b [&_th]:border-neutral-muted [&_th]:py-xs [&_th]:pr-md [&_th]:text-left [&_th]:font-semibold",
    "[&_td]:border-b [&_td]:border-neutral-dimmed [&_td]:py-xs [&_td]:pr-md",
    "[&_code]:bg-neutral-dimmed",
    // In a table every row has an id; chip backgrounds on each one turn the column into noise.
    "[&_td_code]:bg-transparent [&_td_code]:px-0"
].join(" ");

/**
 * One of three things fills the answer box: the skeleton, the answer, or a note that nothing came
 * back. A failure replaces the box altogether; see `AiTurn`.
 *
 * The skeleton shows only until the first token lands. Once text is arriving, the text itself is the
 * progress indicator, and swapping a skeleton in and out under it would flicker.
 *
 * A turn waiting on approval has produced no text yet and has not failed, which is not the same as
 * returning nothing, so it gets neither the note nor the skeleton.
 */
const renderAnswer = (turn: AiTurnViewModel) => {
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
 * The question is a bubble on the right. The answer sits in a filled box on the left, styled like
 * the dashboard's `light` widget (fill and radius, no border), beside the assistant's mark, holding only the text and the tools it ran. The approval card and the follow-ups
 * go under the box, not in it: the approval card is a box of its own, and nesting it would be a card
 * inside a card. A failed turn shows the error block in place of the box, for the same reason.
 *
 * The tools it called show as one line under the answer, which stays in place while the turn runs
 * and after it settles. See `ToolTrace`.
 */
export const AiTurn = ({ turn, latest, busy, onApprove, onReject, onAsk }: AiTurnProps) => {
    const showFollowUps =
        latest && turn.settled && !turn.error && turn.pendingApprovals.length === 0;
    const answer = renderAnswer(turn);

    return (
        <div className="border-t border-neutral-subtle pt-md pb-md first:border-t-0 first:pt-xs">
            <div className="flex justify-end px-sm pb-sm">
                <Text
                    as="div"
                    size="md"
                    className="max-w-[80%] rounded-xl bg-primary-subtle px-sm-extra py-xs-plus font-semibold text-pretty text-neutral-primary"
                >
                    {turn.question}
                </Text>
            </div>

            <div className="flex items-start gap-sm px-sm">
                <span className="grid size-xl shrink-0 place-items-center rounded-full bg-neutral-light">
                    <Icon icon={<AiIcon />} size="sm" label="Assistant" color="accent" />
                </span>
                <div className="min-w-0 flex-1">
                    {turn.error ? (
                        <>
                            <AnswerError message={turn.error} />
                            <ToolTrace turn={turn} />
                        </>
                    ) : answer ? (
                        <div className="rounded-xl bg-neutral-light px-md py-sm-extra">
                            {answer}
                            <ToolTrace turn={turn} />
                        </div>
                    ) : (
                        // No text, e.g. a run that only proposed a change. A box around the trace
                        // alone looks empty.
                        <ToolTrace turn={turn} />
                    )}

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
            </div>
        </div>
    );
};
