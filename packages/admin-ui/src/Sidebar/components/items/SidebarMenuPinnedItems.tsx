import React from "react";
import { useSidebar } from "~/Sidebar/index.js";
import { SidebarMenuRootItem } from "./SidebarMenuRootItem.js";
import { SidebarMenuItemAction } from "./SidebarMenuItemAction.js";
import { ReactComponent as UnPinIcon } from "@webiny/icons/push_pin_off.svg";

const SidebarMenuPinnedItems = () => {
    const sidebar = useSidebar();

    // Don't memoize - we want this to re-render when active state changes
    const pinnedItems = sidebar.getPinnedItemsData();

    if (pinnedItems.length === 0) {
        return null;
    }

    return (
        <>
            {pinnedItems.map(item => {
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
                    <SidebarMenuRootItem
                        key={item.id}
                        text={item.text}
                        icon={item.icon}
                        to={item.to}
                        onClick={item.onClick}
                        active={item.active}
                        action={unpinAction}
                    />
                );
            })}
            <li className="px-sm py-xs">
                <div className="h-px bg-neutral-dimmed" />
            </li>
        </>
    );
};

export { SidebarMenuPinnedItems };
