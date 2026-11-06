import React from "react";
import { Text } from "@webiny/admin-ui";
import type { AiTurnViewModel } from "@webiny/app-admin";
import { AiAnswerProse } from "./AiAnswerProse.js";
import { AnswerSkeleton } from "./AnswerSkeleton.js";

/**
 * The answer slot of a turn: the skeleton, the answer, or a note that nothing came back. A failed
 * turn shows an alert instead of the whole block; see `AiTurn` and `ChatTurn`.
 *
 * The skeleton shows only until the first token lands. Once text is arriving, the text itself is the
 * progress indicator, and swapping a skeleton in and out under it would flicker.
 *
 * A turn waiting on approval has produced no text yet and has not failed, which is not the same as
 * returning nothing, so it gets neither the note nor the skeleton. Shared by the palette and the AI
 * chats panel, so an answer reads the same in both.
 */
export const AiAnswer = ({ turn }: { turn: AiTurnViewModel }) => {
    if (!turn.text && !turn.settled) {
        return <AnswerSkeleton />;
    }

    if (turn.text) {
        return <AiAnswerProse text={turn.text} />;
    }

    if (turn.pendingApprovals.length > 0) {
        return null;
    }

    return (
        <Text as="div" size="md" className="text-neutral-strong">
            No answer returned.
        </Text>
    );
};
