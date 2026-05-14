import React from "react";
import { makeDecoratable } from "@webiny/react-composition";
import { Sidebar } from "@webiny/admin-ui";
import { type SidebarMenuItemGroupProps } from "@webiny/admin-ui/Sidebar/components/items/SidebarMenuItem.js";

const MenuGroupBase = (props: SidebarMenuItemGroupProps) => {
    return <Sidebar.Group {...props} />;
};

export const DecoratableMenuGroup = makeDecoratable("MenuGroup", MenuGroupBase);

const MenuGroup = Object.assign(DecoratableMenuGroup, {
    Action: Sidebar.Item.Action,
    Icon: Sidebar.Item.Icon
});

export { MenuGroup };
