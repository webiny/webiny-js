import React from "react";
import { cn } from "~/utils.js";
import { IconButton, type IconButtonProps } from "~/Button/IconButton.js";

interface SidebarMenuItemActionProps extends Omit<IconButtonProps, "icon"> {
    element?: React.ReactNode;
    showOnHover?: boolean;
}

const SidebarMenuItemAction = ({
    element,
    showOnHover = false,
    className,
    ...props
}: SidebarMenuItemActionProps) => {
    return (
        <IconButton
            icon={element}
            size={"xs"}
            variant={"ghost"}
            className={cn(
                "ml-auto",
                "group-data-[state=collapsed]:hidden",
                showOnHover && [
                    "opacity-0",
                    "group-hover/menu-root-button:opacity-100",
                    "group-hover/menu-sub-button:opacity-100"
                ],
                className
            )}
            {...props}
        />
    );
};

export { SidebarMenuItemAction, type SidebarMenuItemActionProps };
