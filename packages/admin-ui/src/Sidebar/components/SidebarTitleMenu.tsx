import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { makeDecoratable } from "~/utils.js";
import { DropdownMenu } from "~/DropdownMenu/index.js";
import { Icon } from "~/Icon/index.js";
import { useSidebar } from "./SidebarProvider.js";
import { ReactComponent as UnfoldIcon } from "@webiny/icons/unfold_more.svg";

interface SidebarTitleMenuProps {
    /**
     * The title, shown as a button with an up-down chevron.
     */
    text: React.ReactNode;
    /**
     * The menu's items (`DropdownMenu.Item`, `DropdownMenu.Label`, `DropdownMenu.Separator`, ...).
     */
    children: React.ReactNode;
    "data-testid"?: string;
}

/**
 * A sidebar title that opens a menu under the sidebar header, such as a tenant or workspace switcher.
 * Pass it as the sidebar's `title`.
 */
const SidebarTitleMenuBase = ({ text, children, ...props }: SidebarTitleMenuProps) => {
    const { expanded } = useSidebar();
    const [open, setOpen] = useState(false);

    // The menu hangs off the sidebar header. Once the sidebar collapses, the header is gone.
    useEffect(() => {
        if (!expanded) {
            setOpen(false);
        }
    }, [expanded]);

    return (
        // Not modal: a modal menu turns off pointer events on the page, which the sidebar takes
        // for the mouse leaving it, and it collapses under the open menu.
        <DropdownMenu
            open={open}
            onOpenChange={setOpen}
            modal={false}
            align={"start"}
            className={"w-[260px]"}
            trigger={
                <button
                    type={"button"}
                    className={
                        "flex items-center gap-x-xs min-w-0 cursor-pointer text-md font-semibold text-neutral-primary"
                    }
                    data-testid={props["data-testid"]}
                >
                    <span className={"truncate"}>{text}</span>
                    <Icon
                        label={"Open menu"}
                        icon={<UnfoldIcon />}
                        size={"sm"}
                        color={"neutral-strong"}
                        className={"shrink-0"}
                    />
                </button>
            }
        >
            {children}
        </DropdownMenu>
    );
};

const SidebarTitleMenu = makeDecoratable("SidebarTitleMenu", SidebarTitleMenuBase);

export { SidebarTitleMenu, type SidebarTitleMenuProps };
