import React, { useCallback, useMemo, useState, useEffect } from "react";
import { cn, makeDecoratable, withStaticProps } from "~/utils.js";
import { SidebarMenuRootButton } from "./SidebarMenuRootButton.js";
import { SidebarMenuItemIcon } from "./SidebarMenuItemIcon.js";
import { SidebarMenuItemAction } from "./SidebarMenuItemAction.js";
import { SidebarMenuSub } from "./SidebarMenuSub.js";
import { Collapsible } from "radix-ui";
import { Icon } from "~/Icon/index.js";
import { ReactComponent as KeyboardArrowRightIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { ReactComponent as PinIcon } from "@webiny/icons/push_pin.svg";
import { ReactComponent as UnPinIcon } from "@webiny/icons/push_pin_off.svg";
import { type SidebarMenuItemProps } from "./SidebarMenuItem.js";
import { useSidebarMenu } from "~/Sidebar/components/items/SidebarMenuProvider.js";
import { useSidebar } from "~/Sidebar/index.js";

const SidebarMenuItemBase = ({
    children,
    className,
    pinnable,
    action,
    ...buttonProps
}: SidebarMenuItemProps) => {
    const { currentLevel, parentIcon } = useSidebarMenu();
    const sidebar = useSidebar();
    const [showChevron, setShowChevron] = useState(false);

    const menuItemId = useMemo(() => {
        return btoa(`sidebar-item-${currentLevel}-${buttonProps.text}`);
    }, [buttonProps.text, currentLevel]);

    const isSectionExpanded = useMemo(() => {
        return sidebar.isSectionExpanded(menuItemId);
    }, [sidebar.expandedSections]);

    const toggleSectionExpanded = useCallback(() => {
        sidebar.toggleSectionExpanded(menuItemId);
    }, [isSectionExpanded]);

    useEffect(() => {
        if (sidebar.expanded) {
            const timer = setTimeout(() => {
                setShowChevron(true);
            }, 100);
            return () => clearTimeout(timer);
        }
        setShowChevron(false);
        return undefined;
    }, [sidebar.expanded]);

    const isPinned = sidebar.isItemPinned(menuItemId);

    // Icon to use when this item is pinned
    const pinnedItemIcon = useMemo(() => {
        if (buttonProps.pinnedIcon) {
            return buttonProps.pinnedIcon;
        }

        return buttonProps.icon || parentIcon;
    }, [buttonProps.pinnedIcon, buttonProps.icon, parentIcon]);

    // Register when pinned, unregister when unpinned
    // Re-register when active state changes to keep pinned items in sync
    useEffect(() => {
        if (pinnable && isPinned) {
            sidebar.registerPinnedItem({
                id: menuItemId,
                text: buttonProps.text,
                icon: pinnedItemIcon,
                to: buttonProps.to,
                onClick: buttonProps.onClick,
                active: buttonProps.active
            });
        } else if (pinnable && !isPinned) {
            // Only unregister if this item is explicitly unpinned
            sidebar.unregisterPinnedItem(menuItemId);
        }
    }, [pinnable, isPinned, pinnedItemIcon, menuItemId, buttonProps.active]);

    const pinAction = useMemo(() => {
        if (!pinnable) {
            return action;
        }

        const handlePinClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();

            if (isPinned) {
                sidebar.unregisterPinnedItem(menuItemId);
            } else {
                sidebar.registerPinnedItem({
                    id: menuItemId,
                    text: buttonProps.text,
                    icon: pinnedItemIcon,
                    to: buttonProps.to,
                    onClick: buttonProps.onClick,
                    active: buttonProps.active
                });
            }

            sidebar.toggleItemPinned(menuItemId);
        };

        const pinButton = (
            <SidebarMenuItemAction
                element={isPinned ? <UnPinIcon /> : <PinIcon />}
                onClick={handlePinClick}
                showOnHover={true}
            />
        );

        // If there's a custom action, combine them
        // Don't modify the custom action - it should keep its original behavior
        if (action) {
            return (
                <div className="flex items-center gap-xs">
                    {pinButton}
                    {action}
                </div>
            );
        }

        return pinButton;
    }, [pinnable, isPinned, pinnedItemIcon, action, sidebar, menuItemId]);

    const sidebarMenuButton = useMemo(() => {
        if (!children) {
            return <SidebarMenuRootButton {...buttonProps} action={pinAction} />;
        }

        const chevron = showChevron ? (
            <Icon
                label={"Expand / Collapse"}
                size={"sm"}
                className={
                    "ml-auto transition-transform duration-100 group-data-[state=open]/menu-item-collapsible:rotate-180 group-data-[state=collapsed]:hidden"
                }
                color={"neutral-strong"}
                data-sidebar={"menu-item-expanded-indicator"}
                icon={<KeyboardArrowRightIcon />}
                onClick={toggleSectionExpanded}
            />
        ) : null;

        const collapsibleAction = pinnable ? (
            <div className="flex items-center gap-xs">
                {pinAction}
                {chevron}
            </div>
        ) : (
            chevron
        );

        return (
            <Collapsible.Root
                className={cn("w-full group/menu-item-collapsible")}
                open={isSectionExpanded}
                onOpenChange={toggleSectionExpanded}
            >
                <Collapsible.Trigger asChild>
                    <SidebarMenuRootButton {...buttonProps} action={collapsibleAction} />
                </Collapsible.Trigger>
                <Collapsible.Content forceMount className={"hidden data-[state=open]:block!"}>
                    <SidebarMenuSub parentIcon={buttonProps.icon}>{children}</SidebarMenuSub>
                </Collapsible.Content>
            </Collapsible.Root>
        );
    }, [
        children,
        buttonProps,
        menuItemId,
        isSectionExpanded,
        toggleSectionExpanded,
        showChevron,
        pinnable,
        pinAction
    ]);

    return (
        <li
            data-sidebar="menu-item"
            className={cn(
                "group/menu-item relative px-xs-plus",

                // When the sidebar is collapsed, this ensures that the sidebar menu item is highlighted
                // if it contains an active child (no matter how deep in the hierarchy).
                "group-data-[state=collapsed]:[&:has([data-active=true])_[data-sidebar=menu-button]_svg]:fill-neutral-xstrong!",
                "group-data-[state=collapsed]:[&:has([data-active=true])_[data-sidebar=menu-button]]:bg-neutral-dark/5!",
                className
            )}
        >
            {sidebarMenuButton}
        </li>
    );
};

const DecoratableSidebarMenuItem = makeDecoratable("SidebarMenuItem", SidebarMenuItemBase);

const SidebarMenuRootItem = withStaticProps(DecoratableSidebarMenuItem, {
    Icon: SidebarMenuItemIcon,
    Action: SidebarMenuItemAction
});

export { SidebarMenuRootItem, type SidebarMenuItemProps };
