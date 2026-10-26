import React, { useState } from "react";
import { Icon } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { Tooltip } from "@webiny/admin-ui";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";

export interface AssistantMessageProps {
    children: React.ReactNode;
    /** What the copy button copies. No button without it. */
    copyText?: string;
}

const CopyAnswer = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
    };

    return (
        <Tooltip
            side="bottom"
            content={copied ? "Copied" : "Copy"}
            trigger={
                <IconButton
                    variant="ghost"
                    size="sm"
                    icon={<CopyIcon />}
                    aria-label="Copy answer"
                    onClick={copy}
                    onMouseLeave={() => setCopied(false)}
                />
            }
        />
    );
};

/** What the assistant says: its label, then the message on the page itself, with no bubble. */
export const AssistantMessage = ({ children, copyText }: AssistantMessageProps) => (
    <div className="flex flex-col gap-md">
        <div className="flex items-center gap-sm">
            <Icon icon={<AiIcon />} size="md" label="" color="accent" />
            <Text size="sm" className="text-accent-primary">
                Insight
            </Text>
        </div>
        <div className="flex flex-col gap-md text-md text-neutral-primary">{children}</div>
        {copyText ? (
            <div className="flex items-center gap-xs">
                <CopyAnswer text={copyText} />
            </div>
        ) : null}
    </div>
);
