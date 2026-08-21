import React from "react";
import { Icon, Tooltip, cn } from "@webiny/admin-ui";
import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";

interface SidebarRowProps {
    label: React.ReactNode;
    tooltip?: React.ReactNode;
    /**
     * Rows whose value is a single control centre the label against it. Pass `start` when the
     * value is a tall, stacked cell (the file picker's preview) so the label sits beside the top
     * of it rather than halfway down.
     */
    align?: "center" | "start";
    children: React.ReactNode;
}

export const SidebarRow = ({ label, tooltip, align = "center", children }: SidebarRowProps) => {
    const alignToTop = align === "start";

    return (
        <div className={cn("flex gap-xxs", alignToTop ? "items-start" : "items-center")}>
            <div
                className={cn(
                    "w-[80px] flex flex-row items-center gap-xxs shrink-0 text-sm text-neutral-strong",
                    // Line the label's text up with the top edge of the preview thumbnail, which
                    // sits inside the card's `p-xs`.
                    alignToTop && "pt-xs"
                )}
            >
                {label}

                {tooltip ? (
                    <Tooltip
                        trigger={
                            <Icon
                                icon={<InfoIcon />}
                                size={"xs"}
                                label={"More information"}
                                color={"neutral-light"}
                            />
                        }
                        content={tooltip}
                        side={"left"}
                    />
                ) : (
                    <div className={"w-xs shrink-0"} />
                )}
            </div>
            {/* min-w-0 lets the cell shrink below its content's intrinsic width, so long
                unbroken values (e.g. a hashed file name) truncate instead of widening the
                row and pushing controls past the sidebar edge. */}
            <div className={"flex-1 min-w-0"}>{children}</div>
        </div>
    );
};
