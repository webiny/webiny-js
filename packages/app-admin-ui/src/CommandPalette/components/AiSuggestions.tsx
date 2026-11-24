import React from "react";
import { Tag } from "@webiny/admin-ui";
import { ReactComponent as QuestionIcon } from "@webiny/icons/chat_bubble.svg";
import { ReactComponent as ActionIcon } from "@webiny/icons/add.svg";
import { CommandRowLayout } from "./CommandRowLayout.js";
import { GroupHeading } from "./GroupHeading.js";

interface AiSuggestion {
    question: string;
    /** Asks for a change, so the answer stops at an approval instead of running on its own. */
    action?: boolean;
}

/**
 * Shown before the first question. Concrete, clickable examples teach what the assistant can do far
 * better than placeholder text. One of them asks for a change, so the approval step is something a
 * user meets on purpose rather than by surprise.
 */
export const AI_SUGGESTIONS: AiSuggestion[] = [
    { question: "What content models does this project have?" },
    { question: "Which products are on sale?" },
    { question: "What fields does the Product model have?" },
    { question: "Show me the most recently edited entries" },
    { question: "Create a folder for campaign images in the File Library", action: true }
];

/**
 * Two icons only: a question gets a speech bubble and a change gets a plus, so the icon says what
 * kind of request it is rather than what it is about. A change is also tagged "Action".
 */
export const AiSuggestions = ({ onAsk }: { onAsk: (question: string) => void }) => (
    <div className="flex flex-col gap-xxs">
        <GroupHeading title="Suggested" />
        {AI_SUGGESTIONS.map(suggestion => (
            <button
                key={suggestion.question}
                type="button"
                onClick={() => onAsk(suggestion.question)}
                className="w-full cursor-pointer rounded-md text-left transition-colors duration-120 hover:bg-neutral-subtle focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed"
            >
                <CommandRowLayout
                    icon={suggestion.action ? <ActionIcon /> : <QuestionIcon />}
                    title={suggestion.question}
                    trailing={
                        suggestion.action ? <Tag variant="neutral-light" content="Action" /> : null
                    }
                />
            </button>
        ))}
    </div>
);
