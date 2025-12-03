import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { type SidebarMenuItemButtonProps } from "@webiny/admin-ui/Sidebar/components/items/SidebarMenuItem.js";
import { type SidebarMenuItemLinkProps } from "@webiny/admin-ui/Sidebar/components/items/SidebarMenuLink.js";
import { useMenuParentIcon } from "./PinnedMenuItems.js";

const { Menu } = AdminConfig;

const MenuItemWithParentIcon = Menu.Item.createDecorator(Original => {
    return function MenuItemRenderer(props: SidebarMenuItemButtonProps) {
        const icon = useMenuParentIcon();
        if (icon) {
            return <Original {...props} icon={icon} />;
        }
        return <Original {...props} />;
    };
});

const MenuLinkWithParentIcon = Menu.Link.createDecorator(Original => {
    return function MenuLinkRenderer(props: SidebarMenuItemLinkProps) {
        const icon = useMenuParentIcon();
        if (icon) {
            return <Original {...props} icon={icon} />;
        }
        return <Original {...props} />;
    };
});

export const DecoratedMenu = () => {
    return (
        <>
            <MenuItemWithParentIcon />
            <MenuLinkWithParentIcon />
        </>
    );
};
