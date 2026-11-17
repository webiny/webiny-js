import React from "react";
import { IconButton } from "@webiny/admin-ui";
import { ReactComponent as ExpandIcon } from "@webiny/icons/right_panel_open.svg";

export interface CollapsedPanelProps {
    label: string;
    onExpand(): void;
}

/**
 * A collapsed panel: a narrow strip with a button that opens the panel and its label written down
 * the strip. The same strip as the content model editor's collapsed "Fields" sidebar.
 */
export const CollapsedPanel = ({ label, onExpand }: CollapsedPanelProps) => {
    return (
        <div
            data-role={"editor-collapsed-panel"}
            data-affects-preview={"width"}
            className={
                "flex w-[45px] flex-none flex-col items-center gap-md border-l-sm border-l-neutral-dimmed bg-neutral-base pt-md"
            }
        >
            <IconButton
                variant={"ghost"}
                size={"xs"}
                icon={<ExpandIcon />}
                title={`Open ${label}`}
                onClick={onExpand}
            />
            <span
                className={"text-sm font-semibold text-neutral-strong [writing-mode:vertical-rl]"}
            >
                {label}
            </span>
        </div>
    );
};
