import React from "react";
import { Text } from "@webiny/admin-ui";

/** Questions the assistant suggests asking next. Clicking one asks it as written. */
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
        <div className="mt-sm flex flex-wrap gap-xs">
            {questions.map(question => (
                <button
                    key={question}
                    type="button"
                    disabled={disabled}
                    onClick={() => onAsk(question)}
                    className="cursor-pointer rounded-md border border-neutral-muted px-sm py-xxs text-left hover:bg-neutral-subtle disabled:cursor-default disabled:opacity-60"
                >
                    <Text size="sm" className="text-neutral-strong">
                        {question}
                    </Text>
                </button>
            ))}
        </div>
    );
};
