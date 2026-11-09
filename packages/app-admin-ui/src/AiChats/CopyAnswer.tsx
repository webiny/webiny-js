import React from "react";
import { useState } from "react";
import { IconButton } from "@webiny/admin-ui";
import { Tooltip } from "@webiny/admin-ui";
import { ReactComponent as CopyIcon } from "@webiny/icons/content_copy.svg";

type CopyState = "idle" | "copied" | "failed";

const TOOLTIPS: Record<CopyState, string> = {
    idle: "Copy",
    copied: "Copied",
    failed: "Couldn't copy"
};

/**
 * Copies an answer's markdown, and says how it went in its tooltip until the pointer leaves. The
 * clipboard can refuse: no permission, an insecure page, or a document without focus.
 */
export const CopyAnswer = ({ text }: { text: string }) => {
    const [state, setState] = useState<CopyState>("idle");

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setState("copied");
        } catch {
            setState("failed");
        }
    };

    return (
        <Tooltip
            side="bottom"
            content={TOOLTIPS[state]}
            trigger={
                <IconButton
                    variant="ghost"
                    size="sm"
                    icon={<CopyIcon />}
                    aria-label="Copy answer"
                    onClick={copy}
                    onMouseLeave={() => setState("idle")}
                />
            }
        />
    );
};
