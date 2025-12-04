import React from "react";
import { cn } from "~/utils.js";
import { IconButton, type IconButtonProps } from "~/Button/IconButton.js";

interface SidebarMenuItemActionProps extends Omit<IconButtonProps, "icon"> {
    element?: React.ReactNode;
    hideOnCollapsed?: boolean;
}

const SidebarMenuItemAction = ({ element, hideOnCollapsed = false, className, ...props }: SidebarMenuItemActionProps) => {
    return (
        <IconButton
            icon={element}
            size={"xs"}
            variant={"ghost"}
            className={cn(
                "ml-auto",
                hideOnCollapsed && "group-data-[state=collapsed]:hidden",
                "opacity-0 group-hover/menu-root-button:opacity-100 transition-opacity",
                className
            )}
            {...props}
        />
    );
};

export { SidebarMenuItemAction, type SidebarMenuItemActionProps };
