import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { CopyAnswer } from "./CopyAnswer.js";

export interface InsightCardProps {
    children: React.ReactNode;
    /** What the copy button copies. No button without it. */
    copyText?: string;
}

/**
 * What the assistant says in the panel: an accent-tinted card under an "Insight" eyebrow. The tint
 * marks an AI insight in the conversation; the palette keeps the same answer grey. Copy is the only
 * action on an answer.
 */
export const InsightCard = ({ children, copyText }: InsightCardProps) => (
    <div className="flex flex-col gap-sm-extra rounded-xl bg-primary-subtle p-md">
        <div className="flex items-center gap-xs text-sm font-semibold uppercase text-accent-primary">
            <Icon icon={<AiIcon />} size="sm" label="" color="accent" />
            Insight
        </div>
        {children}
        {copyText ? (
            <div className="flex gap-xxs">
                <CopyAnswer text={copyText} />
            </div>
        ) : null}
    </div>
);
