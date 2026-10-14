import React from "react";
import { Icon } from "@webiny/admin-ui";
import { Markdown } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as ErrorIcon } from "@webiny/icons/error.svg";
import { ReactComponent as CollapseIcon } from "@webiny/icons/keyboard_arrow_up.svg";
import type { AiTurnViewModel } from "@webiny/app-admin";
import { ToolTrace } from "./ToolTrace.js";
import { FollowUps } from "./FollowUps.js";
import { AnswerSkeleton } from "./AnswerSkeleton.js";
import { ApprovalPlan } from "./ApprovalPlan.js";
import { AskerInitials } from "./AskerInitials.js";

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
 * answer read at that size and colour looked like a footnote. Tables get rules and padding, since a
 * list of models or entries often comes back as one, and the compiler emits bare cells.
 */
const ANSWER_CLASSES = [
    "leading-[24px] text-neutral-primary",
    // About 70 characters a line. Tables and code are left full width.
    "[&_p]:mb-sm [&_p]:max-w-[70ch] [&_p]:text-pretty [&>*:last-child]:mb-0",
    "[&_ul]:mb-sm [&_ol]:mb-sm [&_li]:mt-xs [&_li]:max-w-[70ch]",
    "[&_table]:mb-sm [&_table]:border-collapse [&_table]:tabular-nums",
    "[&_th]:border-b [&_th]:border-neutral-dimmed [&_th]:py-xs [&_th]:pr-md [&_th]:text-left [&_th]:font-semibold",
    "[&_td]:border-b [&_td]:border-neutral-subtle [&_td]:py-xs [&_td]:pr-md",
    // In a table every row has an id; chip backgrounds on each one turn the column into noise.
    "[&_td_code]:bg-transparent [&_td_code]:px-0"
].join(" ");

/**
 * One of three things fills the answer slot: the skeleton, the answer, or a note that nothing came
 * back. A failure takes the slot instead; see `AiTurn`.
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
    initials: string;
    /** Follow-ups only make sense as the next thing to ask, so older turns drop theirs. */
    latest: boolean;
    busy: boolean;
    onApprove: () => void;
    onReject: () => void;
    onAsk: (question: string) => void;
    /** Set on an earlier turn the user opened again, so it can be shrunk back to one line. */
    onCollapse?: () => void;
}

/*
 * One question and its answer, as a result in the palette rather than a message in a chat: the
 * question reads as a heading, and the answer, the tools it ran and what to ask next sit under it,
 * aligned with the question's text. No bubbles and no boxes; the palette is for a quick ask, and a
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
    onCollapse
}: AiTurnProps) => {
    const showFollowUps =
        latest && turn.settled && !turn.error && turn.pendingApprovals.length === 0;

    return (
        <div className="px-sm py-sm">
            <div className="flex items-center gap-sm">
                <AskerInitials initials={initials} />
                <Text
                    as="div"
                    size="md"
                    className="min-w-0 flex-1 font-semibold text-neutral-primary"
                >
                    {turn.question}
                </Text>
                {onCollapse ? (
                    <button
                        type="button"
                        onClick={onCollapse}
                        aria-expanded={true}
                        className="grid size-lg shrink-0 cursor-pointer place-items-center rounded-md transition-colors duration-150 hover:bg-neutral-light focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed"
                    >
                        <Icon
                            icon={<CollapseIcon />}
                            size="sm"
                            label="Hide answer"
                            color="neutral-light"
                        />
                    </button>
                ) : null}
            </div>

            {/* Indented to line up with the question's text, past the initials. */}
            <div className="mt-xs pl-[calc(var(--spacing-lg)+var(--spacing-sm))]">
                {turn.error ? <AnswerError message={turn.error} /> : renderAnswer(turn)}

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
    );
};
