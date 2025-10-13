import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { type SidebarMenuItemButtonProps } from "@webiny/admin-ui/Sidebar/components/items/SidebarMenuItem.js";
import { type SidebarMenuItemLinkProps } from "@webiny/admin-ui/Sidebar/components/items/SidebarMenuLink.js";
import { useMenuParentIcon } from "./PinnedMenuItems.js";

const { Menu } = AdminConfig;

const MenuItemWithParentIcon = Menu.Item.createDecorator(Original => {
    const MenuItemRenderer = (props: SidebarMenuItemButtonProps) => {
        const icon = useMenuParentIcon();
        if (icon) {
            return <Original {...props} icon={icon} />;
        }
        return <Original {...props} />;
    };
    MenuItemRenderer.displayName = "MenuItemWithParentIcon";
    return MenuItemRenderer;
});

const MenuLinkWithParentIcon = Menu.Link.createDecorator(Original => {
    const MenuLinkRenderer = (props: SidebarMenuItemLinkProps) => {
        const icon = useMenuParentIcon();
        if (icon) {
            return <Original {...props} icon={icon} />;
        }
        return <Original {...props} />;
    };
    MenuLinkRenderer.displayName = "MenuLinkWithParentIcon";
    return MenuLinkRenderer;
});

export const DecoratedMenu = () => {
    return (
        <>
            <MenuItemWithParentIcon />
            <MenuLinkWithParentIcon />
        </>
    );
};
