import React from "react";
import { Text } from "@webiny/admin-ui";

export interface ChatSuggestionsProps {
    questions: string[];
    disabled: boolean;
    onAsk: (question: string) => void;
}

/** Questions to ask next, above the input. Clicking one asks it as written. */
export const ChatSuggestions = ({ questions, disabled, onAsk }: ChatSuggestionsProps) => {
    if (questions.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-sm border-t border-neutral-subtle px-lg pb-sm pt-md">
            <Text as="div" size="md" className="text-neutral-primary">
                Maybe try something like
            </Text>
            <div className="flex flex-wrap gap-xs">
                {questions.map(question => (
                    <button
                        key={question}
                        type="button"
                        disabled={disabled}
                        onClick={() => onAsk(question)}
                        className="cursor-pointer rounded-md border border-neutral-muted bg-neutral-base px-sm py-xs text-left transition-colors duration-150 hover:border-neutral-strong hover:bg-neutral-subtle focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed disabled:cursor-default disabled:opacity-60"
                    >
                        <Text size="md" className="text-neutral-strong">
                            {question}
                        </Text>
                    </button>
                ))}
            </div>
        </div>
    );
};
