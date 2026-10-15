import React from "react";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as HistoryIcon } from "@webiny/icons/history.svg";
import { ReactComponent as ExpandIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import type { AiTurnViewModel } from "@webiny/app-admin";

/** Long enough to fill the line; the rest is cut by CSS. */
const MAX_SUMMARY = 160;

/**
 * The first sentence of an answer's first line, as plain text.
 *
 * Read from `answerStart`, so a line like "I'll check the content models first." does not stand in
 * for the answer. Only the first line, because an answer often goes straight into a list or a table
 * after it ("6 content models:"), and a table flattened into one line reads as noise. Capped, since
 * a line with no sentence end would otherwise run as long as the answer, and the palette's scroll
 * area widens to fit an unbroken line rather than clipping it.
 */
const firstSentence = (turn: AiTurnViewModel): string => {
    if (turn.error) {
        return turn.error;
    }

    const firstLine =
        turn.text
            .slice(turn.answerStart)
            .split("\n")
            .map(line => line.trim())
            .find(Boolean) ?? "";
    const plain = firstLine
        .replace(/^(?:[-*+]|\d+\.)\s+/, "")
        .replace(/[*_`#>|]/g, "")
        .trim()
        // "6 content models:" introduces a list that the line does not show.
        .replace(/:$/, "");
    const end = plain.search(/[.!?](\s|$)/);
    const sentence = end === -1 ? plain : plain.slice(0, end + 1);

    return sentence.length > MAX_SUMMARY ? `${sentence.slice(0, MAX_SUMMARY)}…` : sentence;
};

/**
 * An earlier turn, shrunk to one line: the question, the start of its answer, and a way back in.
 *
 * The palette answers one question at a time. The answer being worked with stays under the input,
 * and what came before is reference, so it takes a line each instead of pushing the current answer
 * down.
 */
export const CollapsedTurn = ({
    turn,
    onExpand
}: {
    turn: AiTurnViewModel;
    onExpand: () => void;
}) => (
    <button
        type="button"
        onClick={onExpand}
        aria-expanded={false}
        className="flex w-full min-w-0 cursor-pointer items-center gap-sm rounded-md px-sm py-xs-plus text-left transition-colors duration-150 hover:bg-neutral-light focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed"
    >
        <Icon icon={<HistoryIcon />} size="sm" label="" color="neutral-light" />
        <Text
            size="md"
            className="max-w-[60%] shrink-0 truncate font-semibold text-neutral-primary"
        >
            {turn.question}
        </Text>
        <Text
            size="sm"
            className="min-w-0 flex-1 truncate text-neutral-muted [contain:inline-size]"
        >
            {firstSentence(turn)}
        </Text>
        <Icon icon={<ExpandIcon />} size="sm" label="Show answer" color="neutral-light" />
    </button>
);
