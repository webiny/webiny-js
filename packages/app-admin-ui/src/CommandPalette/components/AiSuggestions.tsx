import React from "react";
import { Icon, Text } from "@webiny/admin-ui";
import { ReactComponent as HelpIcon } from "@webiny/icons/help.svg";
import { ReactComponent as SchemaIcon } from "@webiny/icons/schema.svg";
import { ReactComponent as HistoryIcon } from "@webiny/icons/history.svg";
import { ReactComponent as TableIcon } from "@webiny/icons/table_chart.svg";
import { ReactComponent as FolderIcon } from "@webiny/icons/create_new_folder.svg";
import { GroupHeading } from "./GroupHeading.js";

export interface AiSuggestion {
    question: string;
    icon: React.ReactElement;
    /** Asks for a change, so it ends in an approval rather than an answer. */
    action?: boolean;
}

/**
 * Shown before the first question. Concrete, clickable examples teach what the assistant can do far
 * better than placeholder text, so every one of these has to be something the assistant's tools can
 * actually do. The action creates a File Manager folder because that is a write tool the assistant
 * has and every project has a File Manager; publishing or creating a model would read well here and
 * then fail.
 */
export const AI_SUGGESTIONS: AiSuggestion[] = [
    { question: "What content models does this project have?", icon: <TableIcon /> },
    { question: "Which products are on sale?", icon: <HelpIcon /> },
    { question: "What fields does the product model have?", icon: <SchemaIcon /> },
    { question: "Show me the most recently edited entries", icon: <HistoryIcon /> },
    {
        question: "Create a File Manager folder called Campaign assets",
        icon: <FolderIcon />,
        action: true
    }
];

const ActionBadge = () => (
    <span className="shrink-0 rounded-sm border border-warning-200 bg-warning-subtle px-xs py-xxs text-sm font-semibold uppercase tracking-wide text-warning-600">
        Action
    </span>
);

export const AiSuggestions = ({ onAsk }: { onAsk: (question: string) => void }) => (
    <div>
        <GroupHeading title="Suggested" />
        {AI_SUGGESTIONS.map(suggestion => (
            <button
                key={suggestion.question}
                type="button"
                onClick={() => onAsk(suggestion.question)}
                className="flex w-full cursor-pointer items-center gap-sm-plus rounded-md px-sm py-xs-plus text-left hover:bg-neutral-dimmed"
            >
                <span className="grid size-xl shrink-0 place-items-center rounded-md border border-neutral-dimmed bg-neutral-subtle">
                    <Icon icon={suggestion.icon} size="md" label="" color="neutral-light" />
                </span>
                <Text as="div" size="md" className="min-w-0 flex-1 truncate text-neutral-primary">
                    {suggestion.question}
                </Text>
                {suggestion.action ? <ActionBadge /> : null}
            </button>
        ))}
    </div>
);
