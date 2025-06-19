import React, { useCallback, useMemo } from "react";
import { cn, makeDecoratable, withStaticProps } from "~/utils";
import { SidebarMenuRootButton } from "./SidebarMenuRootButton";
import { SidebarMenuItemIcon } from "./SidebarMenuItemIcon";
import { SidebarMenuItemAction } from "./SidebarMenuItemAction";
import { SidebarMenuSub } from "./SidebarMenuSub";
import { Collapsible } from "radix-ui";
import { Icon } from "~/Icon";
import { ReactComponent as KeyboardArrowRightIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { type SidebarMenuItemProps } from "./SidebarMenuItem";
import { useSidebarMenu } from "~/Sidebar/components/items/SidebarMenuProvider";
import { useSidebar } from "~/Sidebar";

const SidebarMenuItemBase = ({ children, className, ...buttonProps }: SidebarMenuItemProps) => {
    const { currentLevel } = useSidebarMenu();
    const sidebar = useSidebar();

    const menuItemId = useMemo(() => {
        return btoa(`sidebar-item-${currentLevel}-${buttonProps.text}`);
    }, [buttonProps.text, currentLevel]);

    const isSectionExpanded = useMemo(() => {
        return sidebar.isSectionExpanded(menuItemId);
    }, [sidebar.expandedSections]);

    const toggleSectionExpanded = useCallback(() => {
        sidebar.toggleSectionExpanded(menuItemId);
    }, [isSectionExpanded]);

    const sidebarMenuButton = useMemo(() => {
        if (!children) {
            return <SidebarMenuRootButton {...buttonProps} />;
        }

        const chevron = (
            <Icon
                label={"Expand / Collapse"}
                size={"sm"}
                className={
                    "wby-ml-auto wby-transition-transform wby-duration-175 group-data-[state=open]/menu-item-collapsible:wby-rotate-180 group-data-[state=collapsed]:wby-hidden"
                }
                color={"neutral-strong"}
                data-sidebar={"menu-item-expanded-indicator"}
                icon={<KeyboardArrowRightIcon />}
            />
        );

        return (
            <Collapsible.Root
                className={cn("wby-w-full wby-group/menu-item-collapsible")}
                open={isSectionExpanded}
                onOpenChange={toggleSectionExpanded}
            >
                <Collapsible.Trigger asChild>
                    <SidebarMenuRootButton {...buttonProps} action={chevron} />
                </Collapsible.Trigger>
                <Collapsible.Content
                    forceMount
                    className={"wby-hidden data-[state=open]:!wby-block"}
                >
                    <SidebarMenuSub>{children}</SidebarMenuSub>
                </Collapsible.Content>
            </Collapsible.Root>
        );
    }, [children, buttonProps, menuItemId, isSectionExpanded, toggleSectionExpanded]);

    return (
        <li
            data-sidebar="menu-item"
            className={cn(
                "wby-group/menu-item wby-relative wby-px-xs-plus",

                // When the sidebar is collapsed, this ensures that the sidebar menu item is highlighted
                // if it contains an active child (no matter how deep in the hierarchy).
                "group-data-[state=collapsed]:[&:has([data-active=true])_[data-sidebar=menu-button]_svg]:!wby-fill-neutral-xstrong",
                "group-data-[state=collapsed]:[&:has([data-active=true])_[data-sidebar=menu-button]]:!wby-bg-neutral-dark/5",
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
