import React from "react";
import { SidebarMenuItem, type SidebarMenuItemLinkProps } from "./SidebarMenuItem.js";
import { makeDecoratable, withStaticProps } from "~/utils.js";
import {
    SidebarMenuItemIcon,
    type SidebarMenuItemIconProps
} from "~/Sidebar/components/items/SidebarMenuItemIcon.js";
import {
    SidebarMenuItemAction,
    type SidebarMenuItemActionProps
} from "~/Sidebar/components/items/SidebarMenuItemAction.js";
import {
    SidebarMenuItemBadge,
    type SidebarMenuItemBadgeProps
} from "~/Sidebar/components/items/SidebarMenuItemBadge.js";

const SidebarMenuLinkBase = (props: SidebarMenuItemLinkProps) => {
    return <SidebarMenuItem {...props} />;
};

const DecoratableSidebarMenuLink = makeDecoratable("SidebarMenuLink", SidebarMenuLinkBase);

const SidebarMenuLink = withStaticProps(DecoratableSidebarMenuLink, {
    Icon: SidebarMenuItemIcon,
    Action: SidebarMenuItemAction,
    Badge: SidebarMenuItemBadge
});

export {
    SidebarMenuLink,
    type SidebarMenuItemLinkProps,
    type SidebarMenuItemIconProps,
    type SidebarMenuItemActionProps,
    type SidebarMenuItemBadgeProps
};
