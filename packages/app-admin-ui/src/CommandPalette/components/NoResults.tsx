import React from "react";
import { EmptyState } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { CommandRowLayout } from "./CommandRowLayout.js";
import { GroupHeading } from "./GroupHeading.js";

/**
 * A dead end is the best moment to offer the assistant: the user has already expressed intent in
 * words, so hand that exact query straight to AI rather than making them retype it.
 *
 * `onAskAi` is optional because the assistant is licensed separately. Without it this is a plain
 * "nothing matched" state rather than an offer the project cannot accept.
 */
export interface NoResultsProps {
    query: string;
    onAskAi?: () => void;
}

export const NoResults = ({ query, onAskAi }: NoResultsProps) => (
    <div className="flex flex-col">
        <EmptyState
            size="sm"
            icon={<SearchIcon />}
            className="py-lg"
            title={`No results for “${query}”`}
            description="Check the spelling, or try fewer words."
        />
        {onAskAi ? (
            <div className="flex flex-col gap-xxs">
                <GroupHeading title="Try instead" />
                <button
                    type="button"
                    onClick={onAskAi}
                    className="w-full cursor-pointer rounded-md text-left transition-colors duration-120 hover:bg-neutral-subtle focus-visible:outline-none focus-visible:ring-lg focus-visible:ring-primary-dimmed"
                >
                    <CommandRowLayout
                        icon={<AiIcon />}
                        accent
                        title={`Ask the AI assistant about “${query}”`}
                        description="AI can search your content, and catch typos"
                    />
                </button>
            </div>
        ) : null}
    </div>
);
