import React, { useCallback, useEffect, useMemo, useState } from "react";
import { cn, makeDecoratable, withStaticProps } from "~/utils.js";
import { SidebarMenuRootButton } from "./SidebarMenuRootButton.js";
import { SidebarMenuItemIcon } from "./SidebarMenuItemIcon.js";
import { SidebarMenuItemAction } from "./SidebarMenuItemAction.js";
import { SidebarMenuSub } from "./SidebarMenuSub.js";
import { Collapsible } from "radix-ui";
import { Icon } from "~/Icon/index.js";
import { ReactComponent as KeyboardArrowRightIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { type SidebarMenuItemProps } from "./SidebarMenuItem.js";
import { useSidebarMenu } from "~/Sidebar/components/items/SidebarMenuProvider.js";
import { useSidebar } from "~/Sidebar/index.js";

const SidebarMenuItemBase = ({ children, className, ...buttonProps }: SidebarMenuItemProps) => {
    const { currentLevel } = useSidebarMenu();
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

    const sidebarMenuButton = useMemo(() => {
        if (!children) {
            return <SidebarMenuRootButton {...buttonProps} />;
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
            />
        ) : null;

        return (
            <Collapsible.Root
                className={cn("w-full group/menu-item-collapsible")}
                open={isSectionExpanded}
                onOpenChange={toggleSectionExpanded}
            >
                <Collapsible.Trigger asChild>
                    <SidebarMenuRootButton {...buttonProps} action={chevron} />
                </Collapsible.Trigger>
                <Collapsible.Content forceMount className={"hidden data-[state=open]:block!"}>
                    <SidebarMenuSub>{children}</SidebarMenuSub>
                </Collapsible.Content>
            </Collapsible.Root>
        );
    }, [children, buttonProps, menuItemId, isSectionExpanded, toggleSectionExpanded, showChevron]);

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
