import React from "react";
import { Icon, Text } from "@webiny/admin-ui";
import { ReactComponent as SchemaIcon } from "@webiny/icons/schema.svg";
import { ReactComponent as SellIcon } from "@webiny/icons/sell.svg";
import { ReactComponent as ViewListIcon } from "@webiny/icons/view_list.svg";
import { ReactComponent as HistoryIcon } from "@webiny/icons/history.svg";
import { ReactComponent as CreateFolderIcon } from "@webiny/icons/create_new_folder.svg";
import { GroupHeading } from "./GroupHeading.js";

interface AiSuggestion {
    question: string;
    icon: React.ReactElement;
    /** Asks for a change, so the answer stops at an approval instead of running on its own. */
    action?: boolean;
}

/**
 * Shown before the first question. Concrete, clickable examples teach what the assistant can do far
 * better than placeholder text. One of them asks for a change, so the approval step is something a
 * user meets on purpose rather than by surprise.
 */
export const AI_SUGGESTIONS: AiSuggestion[] = [
    { question: "What content models does this project have?", icon: <SchemaIcon /> },
    { question: "Which products are on sale?", icon: <SellIcon /> },
    { question: "What fields does the product model have?", icon: <ViewListIcon /> },
    { question: "Show me the most recently edited entries", icon: <HistoryIcon /> },
    {
        question: "Create a folder for campaign images in File Manager",
        icon: <CreateFolderIcon />,
        action: true
    }
];

export const AiSuggestions = ({ onAsk }: { onAsk: (question: string) => void }) => (
    <div>
        <GroupHeading title="Suggested" />
        {AI_SUGGESTIONS.map(suggestion => (
            <button
                key={suggestion.question}
                type="button"
                onClick={() => onAsk(suggestion.question)}
                className="flex w-full cursor-pointer items-center gap-sm rounded-md px-sm py-xs text-left transition-colors duration-150 hover:bg-neutral-dimmed focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed active:translate-y-px"
            >
                <span className="grid size-lg shrink-0 place-items-center rounded-md border border-neutral-dimmed bg-neutral-subtle">
                    <Icon icon={suggestion.icon} size="sm" label="" color="neutral-strong" />
                </span>
                <Text as="div" size="md" className="min-w-0 flex-1 truncate text-neutral-primary">
                    {suggestion.question}
                </Text>
                {suggestion.action ? (
                    <span className="shrink-0 rounded-sm bg-warning-subtle px-xs-plus py-xxs text-xs font-semibold uppercase tracking-wide text-warning-xstrong">
                        Action
                    </span>
                ) : null}
            </button>
        ))}
    </div>
);
