import React from "react";
import { IconButton, type IconButtonProps } from "~/Button/IconButton.js";
import { useSidebar } from "~/Sidebar/index.js";

interface SidebarMenuItemActionProps extends Omit<IconButtonProps, "icon"> {
    element?: React.ReactNode;
}

const SidebarMenuItemAction = ({ element, ...props }: SidebarMenuItemActionProps) => {
    const { expanded, transition } = useSidebar();

    if (!expanded || transition !== null) {
        return null;
    }

    return (
        <IconButton
            icon={element}
            size={"xs"}
            variant={"ghost"}
            className={"ml-auto group-data-[state=collapsed]:hidden animate-in fade-in-0 duration-100"}
            {...props}
        />
    );
};

export { SidebarMenuItemAction, type SidebarMenuItemActionProps };
