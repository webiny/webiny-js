import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { Sidebar } from "@webiny/admin-ui";
import { type SidebarMenuItemButtonProps } from "@webiny/admin-ui/Sidebar/components/items/SidebarMenuItem.js";

const MenuLinkBase = (props: SidebarMenuItemButtonProps) => {
    return <Sidebar.Item {...props} />;
};

const DecoratableMenuItem = makeDecoratable("MenuItem", MenuLinkBase);

const MenuItem = Object.assign(DecoratableMenuItem, {
    Action: Sidebar.Item.Action,
    Icon: Sidebar.Item.Icon
});

export { MenuItem };
