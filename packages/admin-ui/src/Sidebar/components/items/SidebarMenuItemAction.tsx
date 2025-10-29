import React from "react";
import { IconButton, type IconButtonProps } from "~/Button/IconButton.js";

interface SidebarMenuItemActionProps extends Omit<IconButtonProps, "icon"> {
    element?: React.ReactNode;
}

const SidebarMenuItemAction = ({ element, ...props }: SidebarMenuItemActionProps) => {
    return (
        <IconButton
            icon={element}
            size={"xs"}
            variant={"ghost"}
            className={"ml-auto group-data-[state=collapsed]:hidden"}
            {...props}
        />
    );
};

export { SidebarMenuItemAction, type SidebarMenuItemActionProps };
