import React, { useCallback, useMemo, useEffect } from "react";
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

    const menuItemId = useMemo(() => {
        return btoa(`sidebar-item-${currentLevel}-${buttonProps.text}`);
    }, [buttonProps.text, currentLevel]);

    const effectiveIcon = buttonProps.icon || parentIcon;

    const isSectionExpanded = useMemo(() => {
        return sidebar.isSectionExpanded(menuItemId);
    }, [sidebar.expandedSections]);

    const toggleSectionExpanded = useCallback(() => {
        sidebar.toggleSectionExpanded(menuItemId);
    }, [isSectionExpanded]);

    const isPinned = sidebar.isItemPinned(menuItemId);

    // Register on mount if already pinned, unregister on unmount
    useEffect(() => {
        if (pinnable && isPinned) {
            sidebar.registerPinnedItem({
                id: menuItemId,
                text: buttonProps.text,
                icon: effectiveIcon,
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
    }, []);

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
                    icon: effectiveIcon,
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

        const chevron = (
            <Icon
                label={"Expand / Collapse"}
                size={"sm"}
                className={
                    "ml-auto transition-transform duration-175 group-data-[state=open]/menu-sub-item-collapsible:rotate-180 group-data-[state=collapsed]:hidden"
                }
                color={"neutral-strong"}
                data-sidebar={"menu-item-expanded-indicator"}
                icon={<KeyboardArrowRightIcon />}
            />
        );

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
