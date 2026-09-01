import React from "react";
import { Button, Icon, Text } from "@webiny/admin-ui";
import { ReactComponent as SearchOffIcon } from "@webiny/icons/search_off.svg";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";

/**
 * A dead end is the best moment to offer the assistant: the user has already expressed intent in
 * words, so hand that exact query straight to AI rather than making them retype it.
 */
export interface NoResultsProps {
    query: string;
    /** Omitted when the assistant is switched off, so no dead affordance is offered. */
    onAskAi?: () => void;
}

export const NoResults = ({ query, onAskAi }: NoResultsProps) => (
    <div className="flex flex-col items-center justify-center px-lg py-xxl text-center">
        <Icon icon={<SearchOffIcon />} size="lg" label="" color="neutral-strong-transparent" />
        <Text as="div" size="lg" className="mt-sm font-semibold text-neutral-strong">
            {`No results for “${query}”`}
        </Text>
        <Text as="div" size="sm" className="mb-md mt-xxs text-neutral-muted">
            No page or action matches. Ask the assistant instead.
        </Text>
        {onAskAi ? (
            <Button
                variant="secondary"
                text="Ask AI"
                icon={<Icon icon={<AiIcon />} size="sm" label="" color="inherit" />}
                onClick={onAskAi}
            />
        ) : null}
    </div>
);
