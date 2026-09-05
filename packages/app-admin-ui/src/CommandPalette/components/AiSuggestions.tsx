import React from "react";
import { Icon, Text } from "@webiny/admin-ui";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { GroupHeading } from "./GroupHeading.js";

/**
 * Shown before the first question. Concrete, clickable examples teach what the assistant can do far
 * better than placeholder text — and every one of these is answerable with the read-only tools.
 */
export const AI_SUGGESTIONS = [
    "What content models does this project have?",
    "Which products are on sale?",
    "What fields does the product model have?",
    "Show me the most recently edited entries"
];

export const AiSuggestions = ({ onAsk }: { onAsk: (question: string) => void }) => (
    <div>
        <GroupHeading title="Suggested" />
        {AI_SUGGESTIONS.map(suggestion => (
            <button
                key={suggestion}
                type="button"
                onClick={() => onAsk(suggestion)}
                className="flex w-full cursor-pointer items-center gap-sm rounded-md px-sm py-xs text-left hover:bg-neutral-dimmed"
            >
                <span className="grid size-lg shrink-0 place-items-center rounded-md border border-neutral-dimmed bg-neutral-subtle">
                    <Icon icon={<AiIcon />} size="sm" label="" color="neutral-light" />
                </span>
                <Text as="div" size="md" className="min-w-0 flex-1 truncate text-neutral-primary">
                    {suggestion}
                </Text>
            </button>
        ))}
    </div>
);
