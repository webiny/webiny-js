import React, { useEffect, useState } from "react";
import { Separator } from "~/Separator/index.js";
import { IconButton } from "~/Button/index.js";
import { useSidebar } from "./SidebarProvider.js";
import { ReactComponent as PinSidebarIcon } from "@webiny/icons/chrome_reader_mode.svg";
import { ReactComponent as UnpinSidebarIcon } from "@webiny/icons/width_full.svg";
import { Tooltip } from "~/Tooltip/index.js";

interface SidebarHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
    icon?: React.ReactNode;
    title?: React.ReactNode;
}

const SidebarHeader = ({ title, icon }: SidebarHeaderProps) => {
    const { togglePinned, expanded, pinned } = useSidebar();
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        if (expanded) {
            const timer = setTimeout(() => {
                setShowButton(true);
            }, 100);
            return () => clearTimeout(timer);
        }
        setShowButton(false);
        return undefined;
    }, [expanded]);

    return (
        <>
            <div className={"px-xs-plus"}>
                <div
                    data-sidebar="header"
                    className={
                        "flex justify-between items-center gap-sm py-xs-plus px-xs overflow-x-hidden"
                    }
                >
                    <div
                        className={
                            "flex items-center gap-x-sm [&_a]:no-underline! [&_a]:text-neutral-primary! truncate"
                        }
                    >
                        <div className={"flex shrink-0"}>{icon}</div>

                        <span className={"text-md font-semibold truncate"}>{title}</span>
                    </div>

                    {showButton && (
                        <div className={"size-md"}>
                            <Tooltip
                                side={"right"}
                                trigger={
                                    <IconButton
                                        icon={pinned ? <UnpinSidebarIcon /> : <PinSidebarIcon />}
                                        data-sidebar="trigger"
                                        size="xs"
                                        variant={"ghost"}
                                        onClick={togglePinned}
                                    />
                                }
                                content={pinned ? "Unlock sidebar" : "Lock sidebar open"}
                            />
                        </div>
                    )}
                </div>
            </div>
            <div className={"px-sm py-xs"}>
                <Separator className={"mb-px"} />
            </div>
        </>
    );
};

export { SidebarHeader, type SidebarHeaderProps };
