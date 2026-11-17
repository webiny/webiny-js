import React from "react";
import { IconButton } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { ReactComponent as LeftPanelIcon } from "@webiny/icons/left_panel_open.svg";
import { ReactComponent as RightPanelIcon } from "@webiny/icons/right_panel_open.svg";
import type { PanelSide } from "./types.js";

export interface CollapsedPanelProps {
    label: string;
    side: PanelSide;
    /** Set when the panel was just collapsed with its own button, which is gone now. */
    autoFocus: boolean;
    onExpand(): void;
}

/**
 * A collapsed panel: a narrow strip with a button that opens the panel and its label written down
 * the strip. The same strip as the content model editor's collapsed "Fields" sidebar. The button sits
 * where the open panel's collapse button is (`PanelHeader`), so it does not jump when toggled.
 */
export const CollapsedPanel = ({ label, side, autoFocus, onExpand }: CollapsedPanelProps) => {
    return (
        <div
            data-role={"editor-collapsed-panel"}
            data-affects-preview={"width"}
            className={cn(
                "flex w-[45px] flex-none flex-col items-center gap-md bg-neutral-base pt-sm",
                side === "left"
                    ? "border-r-sm border-r-neutral-dimmed"
                    : "border-l-sm border-l-neutral-dimmed"
            )}
        >
            <div className={"flex h-xl items-center"}>
                <IconButton
                    variant={"ghost"}
                    size={"xs"}
                    icon={side === "left" ? <LeftPanelIcon /> : <RightPanelIcon />}
                    title={`Open ${label}`}
                    autoFocus={autoFocus}
                    onClick={onExpand}
                />
            </div>
            <span
                className={"text-sm font-semibold text-neutral-strong [writing-mode:vertical-rl]"}
            >
                {label}
            </span>
        </div>
    );
};
