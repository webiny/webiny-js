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
        <div className={"flex items-center gap-xxs"}>
            <div
                className={
                    "w-[80px] flex flex-row items-center gap-xxs shrink-0 text-sm text-neutral-strong"
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
