import React from "react";
import { Icon } from "@webiny/admin-ui";
import { Markdown } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as ErrorIcon } from "@webiny/icons/error.svg";
import type { AiTurnViewModel } from "@webiny/app-admin";
import { AnswerSkeleton } from "./AnswerSkeleton.js";

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

/**
 * The answer slot of a turn: a failure if it failed, otherwise whatever `renderAnswer` picks. Shared
 * by the palette and the AI chats panel, so an answer reads the same in both.
 */
export const AiAnswer = ({ turn }: { turn: AiTurnViewModel }) => {
    if (turn.error) {
        return <AnswerError message={turn.error} />;
    }
    return renderAnswer(turn);
};
