import React from "react";
import { Icon, type IconProps } from "~/Icon/index.js";
import { makeDecoratable } from "@webiny/react-composition";

interface SidebarMenuItemIconProps extends Omit<IconProps, "icon"> {
    element?: React.ReactNode;
}

const SidebarMenuItemIconBase = ({ element, ...props }: SidebarMenuItemIconProps) => {
    if (!element) {
        return null;
    }

    return <Icon icon={element} size={"sm"} color={"neutral-strong"} {...props} />;
};

const SidebarMenuItemIcon = makeDecoratable("SidebarMenuItemIcon", SidebarMenuItemIconBase);

export { SidebarMenuItemIcon, type SidebarMenuItemIconProps };
