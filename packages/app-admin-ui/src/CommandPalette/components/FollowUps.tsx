import React from "react";
import { Button } from "@webiny/admin-ui";

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
                <Button
                    key={question}
                    variant="secondary"
                    size="sm"
                    text={question}
                    disabled={disabled}
                    onClick={() => onAsk(question)}
                />
            ))}
        </div>
    );
};
