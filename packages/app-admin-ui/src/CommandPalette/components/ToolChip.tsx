import React from "react";
import { cn } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as CheckIcon } from "@webiny/icons/check.svg";
import { ReactComponent as SpinnerIcon } from "@webiny/icons/autorenew.svg";

export interface ToolChipProps {
    name: string;
    /** Done chips read as confirmed work; the running one keeps spinning. */
    state: "running" | "done";
}

/**
 * One tool the assistant called. Icon colour comes from the parent because `Icon` only offers
 * neutral/accent variants — `inherit` lets the chip's own text colour drive it.
 */
export const ToolChip = ({ name, state }: ToolChipProps) => {
    const done = state === "done";

    return (
        <span
            className={cn(
                "inline-flex items-center gap-xs rounded-xl border px-sm py-xxs",
                done
                    ? "border-success-subtle bg-success-subtle text-success"
                    : "border-neutral-dimmed bg-neutral-subtle text-neutral-strong"
            )}
        >
            <Icon
                icon={done ? <CheckIcon /> : <SpinnerIcon />}
                size="xs"
                label=""
                color="inherit"
                className={done ? undefined : "animate-spin"}
            />
            <Text size="sm" className="font-mono">
                {name}
            </Text>
        </span>
    );
};
