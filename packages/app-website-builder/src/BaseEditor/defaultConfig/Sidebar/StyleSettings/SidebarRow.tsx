import React from "react";
import { Icon, Tooltip, cn } from "@webiny/admin-ui";
import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";

interface SidebarRowProps {
    label: React.ReactNode;
    tooltip?: React.ReactNode;
    /**
     * Where the label sits vertically next to the row's value.
     *
     * By default it lines up with the middle of the value, which is what a row holding one
     * control wants. Pass `start` when the value is tall - the file picker's stacked preview,
     * for one - so the label sits beside the top of it instead of floating halfway down the row.
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
                    // Reserve exactly one control's height (a compact trigger: a 20px icon plus
                    // `py-xs`) and center within it, so the label lands where it would if the row
                    // were centered. Without this the label shifts up the moment the value grows
                    // taller than one control - which, for the file picker, is whenever a file
                    // happens to be selected.
                    alignToTop && "min-h-[28px]"
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
