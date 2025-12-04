import React, { useMemo } from "react";
import { useSidebar } from "~/Sidebar/index.js";
import { SidebarMenuRootButton } from "./SidebarMenuRootButton.js";
import { SidebarMenuItemAction } from "./SidebarMenuItemAction.js";
import { ReactComponent as UnPinIcon } from "@webiny/icons/push_pin_off.svg";
import { cn } from "~/utils.js";

interface PinnedItemData {
    id: string;
    text: React.ReactNode;
    icon?: React.ReactNode;
    to?: string;
    onClick?: React.MouseEventHandler;
    active?: boolean;
}

interface SidebarMenuPinnedItemsProps {
    children: React.ReactNode;
}

/**
 * Recursively traverse the sidebar menu tree to extract pinned items
 */
const extractPinnedItems = (
    children: React.ReactNode,
    pinnedIds: string[],
    parentIcon?: React.ReactNode,
    level: number = 0
): PinnedItemData[] => {
    const items: PinnedItemData[] = [];

    React.Children.forEach(children, (child) => {
        if (!React.isValidElement(child)) {
            return;
        }

        const props = child.props as any;
        const text = props.text;

        if (!text) {
            return;
        }

        // Determine if this is a pinnable item (only root level items or nested items with pinnable prop)
        const isPinnable = props.pinnable === true;

        // Generate the same ID as used in SidebarMenuRootItem/SidebarMenuSubItem
        // Root items are at level 0, first nested items are at level 1, etc.
        const itemId = btoa(`sidebar-item-${level}-${text}`);

        // Check if this item is pinned
        if (isPinnable && pinnedIds.includes(itemId)) {
            items.push({
                id: itemId,
                text: props.text,
                icon: props.icon || parentIcon, // Use parent icon if no icon is provided
                to: props.to,
                onClick: props.onClick,
                active: props.active
            });
        }

        // Recursively check children, passing down the icon
        // Children of a Sidebar.Item will be rendered at level + 1 (because SidebarMenuSub increments the level)
        if (props.children) {
            const childIcon = props.icon || parentIcon;
            items.push(...extractPinnedItems(props.children, pinnedIds, childIcon, level + 1));
        }
    });

    return items;
};

const SidebarMenuPinnedItems: React.FC<SidebarMenuPinnedItemsProps> = ({ children }) => {
    const sidebar = useSidebar();

    const pinnedItems = useMemo(() => {
        if (sidebar.pinnedItems.length === 0) {
            return [];
        }
        return extractPinnedItems(children, sidebar.pinnedItems);
    }, [children, sidebar.pinnedItems]);

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

