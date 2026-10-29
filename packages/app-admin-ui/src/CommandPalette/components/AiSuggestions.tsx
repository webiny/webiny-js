import React from "react";
import { Icon, Tag, Text } from "@webiny/admin-ui";
import { ReactComponent as QuestionIcon } from "@webiny/icons/forum.svg";
import { ReactComponent as ActionIcon } from "@webiny/icons/add.svg";
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
    { question: "What fields does the product model have?" },
    { question: "Show me the most recently edited entries" },
    { question: "Create a folder for campaign images in File Manager", action: true }
];

/**
 * Two icons only, as in the design: a question gets a conversation icon and a change gets a plus, so
 * the icon says what kind of request it is rather than what it is about.
 */
export const AiSuggestions = ({ onAsk }: { onAsk: (question: string) => void }) => (
    <div>
        <GroupHeading title="Suggested" />
        <div className="flex flex-col gap-xxs">
            {AI_SUGGESTIONS.map(suggestion => (
                <button
                    key={suggestion.question}
                    type="button"
                    onClick={() => onAsk(suggestion.question)}
                    className="flex w-full cursor-pointer items-center gap-sm rounded-md px-sm py-sm-plus text-left transition-colors duration-150 hover:bg-neutral-light focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed active:translate-y-px"
                >
                    <Icon
                        icon={suggestion.action ? <ActionIcon /> : <QuestionIcon />}
                        size="md"
                        label=""
                        color="neutral-light"
                    />
                    <Text
                        as="div"
                        size="md"
                        className="min-w-0 flex-1 truncate text-neutral-primary"
                    >
                        {suggestion.question}
                    </Text>
                    {suggestion.action ? (
                        <Tag className="shrink-0" variant="neutral-muted" content="ACTION" />
                    ) : null}
                </button>
            ))}
        </div>
    </div>
);
