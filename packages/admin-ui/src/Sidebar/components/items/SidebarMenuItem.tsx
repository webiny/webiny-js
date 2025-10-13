import React from "react";
import { makeDecoratable, withStaticProps } from "~/utils.js";
import { SidebarMenuItemIcon, type SidebarMenuItemIconProps } from "./SidebarMenuItemIcon.js";
import { SidebarMenuItemAction, type SidebarMenuItemActionProps } from "./SidebarMenuItemAction.js";
import { SidebarMenuSubItem } from "./SidebarMenuSubItem.js";
import { useSidebarMenu } from "./SidebarMenuProvider.js";
import { SidebarMenuRootItem } from "~/Sidebar/components/items/SidebarMenuRootItem.js";
import { LinkProps } from "~/index.js";

export interface SidebarMenuItemBaseProps {
    text: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
    onClick?: React.MouseEventHandler;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    variant?: "group-label";
    active?: boolean;
    disabled?: boolean;
}

type SidebarMenuItemButtonProps = SidebarMenuItemBaseProps & {
    to?: never;
    route?: never;
    params?: never;
};
type SidebarMenuItemGroupProps = SidebarMenuItemButtonProps;
type SidebarMenuItemLinkProps = SidebarMenuItemBaseProps & LinkProps;

type SidebarMenuItemProps = SidebarMenuItemButtonProps | SidebarMenuItemLinkProps;

const SidebarMenuItemBase = (props: SidebarMenuItemProps) => {
    const { currentLevel } = useSidebarMenu();

    if (currentLevel === 0) {
        return <SidebarMenuRootItem {...props} />;
    }

    return <SidebarMenuSubItem {...props} />;
};

const DecoratableSidebarMenuItem = makeDecoratable("SidebarMenuItem", SidebarMenuItemBase);

const SidebarMenuItem = withStaticProps(DecoratableSidebarMenuItem, {
    Icon: SidebarMenuItemIcon,
    Action: SidebarMenuItemAction
});

export {
    SidebarMenuItem,
    type SidebarMenuItemProps,
    type SidebarMenuItemButtonProps,
    type SidebarMenuItemLinkProps,
    type SidebarMenuItemGroupProps,
    type SidebarMenuItemIconProps,
    type SidebarMenuItemActionProps
};
