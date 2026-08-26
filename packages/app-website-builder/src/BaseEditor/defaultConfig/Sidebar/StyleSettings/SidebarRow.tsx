import React from "react";
import { Icon, Tooltip } from "@webiny/admin-ui";
import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";

interface SidebarRowProps {
    label: React.ReactNode;
    tooltip?: React.ReactNode;
    children: React.ReactNode;
}

export const SidebarRow = ({ label, tooltip, children }: SidebarRowProps) => {
    return (
        // The label sits at the top of the row rather than centered against the value, so that a
        // row is free to render something taller than one control - the file picker's stacked
        // preview, say - without the label drifting to the middle of it.
        <div className={"flex items-start gap-xxs"}>
            {/* `pt-sm` is half the difference between a standard control (a `size="md"` Select is
                32px) and this label's 16px line, which puts the label exactly where centering
                would for the ordinary single-control row, and leaves it there for taller ones. */}
            <div
                className={
                    "w-[80px] pt-sm flex flex-row items-center gap-xxs shrink-0 text-sm text-neutral-strong"
                }
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
