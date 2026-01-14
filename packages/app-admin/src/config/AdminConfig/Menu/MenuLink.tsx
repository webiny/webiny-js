import React from "react";
import { makeDecoratable } from "~/index.js";
import { Sidebar } from "@webiny/admin-ui";
import { type SidebarMenuItemLinkProps } from "@webiny/admin-ui/Sidebar/components/items/SidebarMenuLink.js";
import { useRoute } from "@webiny/app-admin";

const MenuLinkBase = (props: SidebarMenuItemLinkProps) => {
    const { route } = useRoute();

    if (!route) {
        return null;
    }

    const active = route.pathname === props.to.split("?")[0];

    return <Sidebar.Link {...props} active={active} />;
};

const DecoratableMenuLink = makeDecoratable("MenuLink", MenuLinkBase);

const MenuLink = Object.assign(DecoratableMenuLink, {
    Action: Sidebar.Link.Action,
    Icon: Sidebar.Link.Icon
});

export { MenuLink };
