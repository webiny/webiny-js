import React from "react";

/** The design shows at most three, so a long list never pushes the input out of view. */
const MAX_FOLLOW_UPS = 3;

/**
 * Questions to ask next, as small secondary buttons under the newest answer. Clicking one asks it as
 * written. Also used for the starter questions in an empty chats panel.
 */
export const FollowUps = ({
    questions,
    disabled,
    onAsk
}: {
    questions: string[];
    disabled: boolean;
    onAsk: (question: string) => void;
}) => {
    if (questions.length === 0) {
        return null;
    }

    return (
        <div role="group" aria-label="Suggested follow-ups" className="flex flex-wrap gap-sm">
            {questions.slice(0, MAX_FOLLOW_UPS).map(question => (
                <button
                    key={question}
                    type="button"
                    disabled={disabled}
                    onClick={() => onAsk(question)}
                    className="h-lg cursor-pointer rounded-sm bg-neutral-dimmed px-sm text-left text-sm text-neutral-primary transition-colors duration-120 hover:bg-neutral-muted focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed active:bg-neutral-strong disabled:cursor-default disabled:bg-neutral-disabled disabled:text-neutral-disabled"
                >
                    {question}
                </button>
            ))}
        </div>
    );
};
