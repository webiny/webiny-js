import React from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import { makeDecoratable } from "~/utils.js";
import { DropdownMenu } from "~/DropdownMenu/index.js";
import { Icon } from "~/Icon/index.js";
import { useSidebar } from "./SidebarProvider.js";
import { ReactComponent as UnfoldIcon } from "@webiny/icons/unfold_more_narrow.svg";

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
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ sideOffset: 4, alignOffset: 0, width: 260 });

    // The trigger is only the title, but the menu spans the whole header row, icon included.
    const onOpenChange = (next: boolean) => {
        const trigger = triggerRef.current;
        const header = trigger?.closest("[data-sidebar='header']");
        if (next && trigger && header) {
            const triggerRect = trigger.getBoundingClientRect();
            const headerRect = header.getBoundingClientRect();
            setPosition({
                sideOffset: headerRect.bottom - triggerRect.bottom,
                alignOffset: headerRect.left - triggerRect.left,
                // A little wider than the header, so the menu laps over the sidebar's edge.
                width: headerRect.width + 16
            });
        }
        setOpen(next);
    };

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
            onOpenChange={onOpenChange}
            modal={false}
            align={"start"}
            sideOffset={position.sideOffset}
            alignOffset={position.alignOffset}
            style={{ width: position.width }}
            trigger={
                <button
                    ref={triggerRef}
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
