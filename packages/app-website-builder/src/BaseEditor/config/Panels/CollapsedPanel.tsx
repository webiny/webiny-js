import React from "react";
import { IconButton } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { ReactComponent as LeftPanelIcon } from "@webiny/icons/left_panel_open.svg";
import { ReactComponent as RightPanelIcon } from "@webiny/icons/right_panel_open.svg";
import type { PanelSide } from "./types.js";

export interface CollapsedPanelProps {
    label: string;
    side: PanelSide;
    onExpand(): void;
}

/**
 * A collapsed panel: a narrow strip with a button that opens the panel and its label written down
 * the strip. The same strip as the content model editor's collapsed "Fields" sidebar. The button sits
 * where the open panel's collapse button is (`PanelHeader`), so it does not jump when toggled.
 */
export const CollapsedPanel = ({ label, side, onExpand }: CollapsedPanelProps) => {
    // On the canvas side of the strip.
    let border = "border-l-sm border-l-neutral-dimmed";
    if (side === "left") {
        border = "border-r-sm border-r-neutral-dimmed";
    }

    return (
        /*
         * The whole strip opens the panel, label included. The button is there for the keyboard; its
         * click reaches this handler too.
         */
        <div
            data-role={"editor-collapsed-panel"}
            onClick={onExpand}
            className={cn(
                "flex h-full w-[45px] flex-none cursor-pointer flex-col items-center gap-md bg-neutral-base pt-sm select-none",
                border
            )}
        >
            <div className={"flex h-[40px] items-center"}>
                <IconButton
                    variant={"ghost"}
                    size={"xs"}
                    icon={side === "left" ? <LeftPanelIcon /> : <RightPanelIcon />}
                    title={`Open ${label}`}
                    data-panel-expand
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
