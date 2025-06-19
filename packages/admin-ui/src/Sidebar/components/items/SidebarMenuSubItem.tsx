import React, { useCallback, useMemo } from "react";
import { cn } from "~/utils";
import { Collapsible } from "radix-ui";
import { SidebarMenuSubButton } from "./SidebarMenuSubButton";
import { SidebarMenuSubItemIndentation } from "./SidebarMenuSubItemIndentation";
import { SidebarMenuSub } from "./SidebarMenuSub";
import { IconButton } from "~/Button";
import { ReactComponent as KeyboardArrowRightIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import { useSidebarMenu } from "./SidebarMenuProvider";
import { type SidebarMenuItemProps } from "./SidebarMenuItem";
import { useSidebar } from "~/Sidebar";

const SidebarMenuSubItem = ({ children, className, ...buttonProps }: SidebarMenuItemProps) => {
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

    const sidebarMenuSubButton = useMemo(() => {
        if (!children) {
            return (
                <>
                    <SidebarMenuSubItemIndentation
                        lvl={currentLevel}
                        variant={buttonProps.variant}
                    />
                    <SidebarMenuSubButton {...buttonProps} />
                </>
            );
        }

        const chevron = (
            <IconButton
                variant={"ghost"}
                size={"xs"}
                className={
                    "wby-ml-auto wby-transition-transform wby-duration-175 group-data-[state=open]/menu-sub-item-collapsible:wby-rotate-180 group-data-[state=collapsed]:wby-hidden"
                }
                color={"neutral-strong"}
                data-sidebar={"menu-item-expanded-indicator"}
                icon={<KeyboardArrowRightIcon />}
            />
        );

        return (
            <Collapsible.Root className="wby-w-full wby-group/menu-sub-item-collapsible">
                <div className={"wby-flex wby-items-center"}>
                    <SidebarMenuSubItemIndentation
                        lvl={currentLevel}
                        variant={buttonProps.variant}
                    />
                    <Collapsible.Trigger asChild>
                        <SidebarMenuSubButton {...buttonProps} action={chevron} />
                    </Collapsible.Trigger>
                </div>
                <Collapsible.Content>
                    <SidebarMenuSub>{children}</SidebarMenuSub>
                </Collapsible.Content>
            </Collapsible.Root>
        );
    }, [children, buttonProps, currentLevel, menuItemId, isSectionExpanded, toggleSectionExpanded]);

    return (
        <li
            data-sidebar="menu-sub-item"
            className={cn("wby-group/menu-sub-item wby-relative wby-flex", className)}
        >
            {sidebarMenuSubButton}
        </li>
    );
};

export { SidebarMenuSubItem };
