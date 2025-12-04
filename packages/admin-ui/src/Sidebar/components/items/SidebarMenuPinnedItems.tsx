import React, { useMemo } from "react";
import { useSidebar } from "~/Sidebar/index.js";
import { SidebarMenuRootButton } from "./SidebarMenuRootButton.js";
import { SidebarMenuItemAction } from "./SidebarMenuItemAction.js";
import { ReactComponent as UnPinIcon } from "@webiny/icons/push_pin_off.svg";
import { cn } from "~/utils.js";

interface SidebarMenuPinnedItemsProps {
    children: React.ReactNode;
}

const SidebarMenuPinnedItems: React.FC<SidebarMenuPinnedItemsProps> = ({ children }) => {
    const sidebar = useSidebar();

    const pinnedItems = useMemo(() => {
        return sidebar.getPinnedItemsData();
    }, [sidebar]);

    if (pinnedItems.length === 0) {
        return null;
    }

    return (
        <>
            {pinnedItems.map((item) => {
                const handleUnpin = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    e.preventDefault();
                    sidebar.toggleItemPinned(item.id);
                };

                const unpinAction = (
                    <SidebarMenuItemAction
                        element={<UnPinIcon />}
                        onClick={handleUnpin}
                        showOnHover={true}
                    />
                );

                return (
                    <li
                        key={item.id}
                        data-sidebar="menu-item"
                        data-pinned="true"
                        className={cn(
                            "group/menu-item relative px-xs-plus",
                            "group-data-[state=collapsed]:[&:has([data-active=true])_[data-sidebar=menu-button]_svg]:fill-neutral-xstrong!",
                            "group-data-[state=collapsed]:[&:has([data-active=true])_[data-sidebar=menu-button]]:bg-neutral-dark/5!"
                        )}
                    >
                        <SidebarMenuRootButton
                            text={item.text}
                            icon={item.icon}
                            to={item.to}
                            onClick={item.onClick}
                            active={item.active}
                            action={unpinAction}
                        />
                    </li>
                );
            })}
            <li className="px-sm py-xs">
                <div className="h-px bg-neutral-dimmed" />
            </li>
        </>
    );
};

export { SidebarMenuPinnedItems };

