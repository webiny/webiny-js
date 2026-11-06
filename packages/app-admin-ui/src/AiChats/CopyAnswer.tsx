import React, { useState } from "react";
import { IconButton } from "@webiny/admin-ui";
import { Tooltip } from "@webiny/admin-ui";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";

/** Copies an answer's markdown, and says so in its tooltip until the pointer leaves. */
export const CopyAnswer = ({ text }: { text: string }) => {
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
