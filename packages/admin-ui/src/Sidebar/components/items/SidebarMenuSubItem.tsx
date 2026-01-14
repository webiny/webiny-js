import React, { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "~/utils.js";
import { Collapsible } from "radix-ui";
import { SidebarMenuSubButton } from "./SidebarMenuSubButton.js";
import { SidebarMenuSubItemIndentation } from "./SidebarMenuSubItemIndentation.js";
import { SidebarMenuSub } from "./SidebarMenuSub.js";
import { Icon } from "~/Icon/index.js";
import { ReactComponent as KeyboardArrowRightIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { ReactComponent as PinIcon } from "@webiny/icons/push_pin.svg";
import { ReactComponent as UnPinIcon } from "@webiny/icons/push_pin_off.svg";
import { useSidebarMenu } from "./SidebarMenuProvider.js";
import { type SidebarMenuItemProps } from "./SidebarMenuItem.js";
import { useSidebar } from "~/Sidebar/index.js";
import { SidebarMenuItemAction } from "./SidebarMenuItemAction.js";

const SidebarMenuSubItem = ({
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

    const isPinned = sidebar.isItemPinned(menuItemId);

    // Use pinnedIcon for pinned items if provided
    const pinnedIcon = useMemo(() => {
        return isPinned && buttonProps.pinnedIcon
            ? buttonProps.pinnedIcon
            : buttonProps.icon || parentIcon;
    }, [isPinned, buttonProps.pinnedIcon, buttonProps.icon, parentIcon]);

    // Register on mount if already pinned, unregister on unmount
    // Re-register when active state changes to keep pinned items in sync
    React.useEffect(() => {
        if (pinnable && isPinned) {
            sidebar.registerPinnedItem({
                id: menuItemId,
                text: buttonProps.text,
                icon: pinnedIcon,
                to: buttonProps.to,
                onClick: buttonProps.onClick,
                active: buttonProps.active
            });
        }

        return () => {
            if (pinnable) {
                sidebar.unregisterPinnedItem(menuItemId);
            }
        };
    }, [pinnable, isPinned, menuItemId, buttonProps.active, pinnedIcon]);

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
                    icon: pinnedIcon,
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
    }, [pinnable, isPinned, action, sidebar, menuItemId]);

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

    const sidebarMenuSubButton = useMemo(() => {
        if (!children) {
            return (
                <>
                    <SidebarMenuSubItemIndentation
                        lvl={currentLevel}
                        variant={buttonProps.variant}
                    />
                    <SidebarMenuSubButton {...buttonProps} action={pinAction} />
                </>
            );
        }

        const chevron = showChevron ? (
            <Icon
                label={"Expand / Collapse"}
                size={"sm"}
                className={
                    "ml-auto transition-transform duration-100 group-data-[state=open]/menu-sub-item-collapsible:rotate-180 group-data-[state=collapsed]:hidden"
                }
                color={"neutral-strong"}
                data-sidebar={"menu-item-expanded-indicator"}
                icon={<KeyboardArrowRightIcon />}
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
                className="w-full group/menu-sub-item-collapsible"
                open={isSectionExpanded}
                onOpenChange={toggleSectionExpanded}
            >
                <div className={"flex items-center"}>
                    <SidebarMenuSubItemIndentation
                        lvl={currentLevel}
                        variant={buttonProps.variant}
                    />
                    <Collapsible.Trigger asChild>
                        <SidebarMenuSubButton
                            {...buttonProps}
                            action={collapsibleAction}
                            className={
                                "group-data-[state=open]/menu-sub-item-collapsible:font-semibold!"
                            }
                        />
                    </Collapsible.Trigger>
                </div>
                <Collapsible.Content>
                    <SidebarMenuSub parentIcon={buttonProps.icon}>{children}</SidebarMenuSub>
                </Collapsible.Content>
            </Collapsible.Root>
        );
    }, [
        children,
        buttonProps,
        currentLevel,
        menuItemId,
        isSectionExpanded,
        toggleSectionExpanded,
        showChevron,
        pinnable,
        pinAction
    ]);

    return (
        <li
            data-sidebar="menu-sub-item"
            className={cn("group/menu-sub-item relative flex", className)}
        >
            {sidebarMenuSubButton}
        </li>
    );
};

export { SidebarMenuSubItem };
