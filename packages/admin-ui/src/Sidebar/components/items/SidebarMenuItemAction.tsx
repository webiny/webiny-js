import React, { useEffect, useState } from "react";
import { IconButton, type IconButtonProps } from "~/Button/IconButton.js";
import { useSidebar } from "~/Sidebar/index.js";

interface SidebarMenuItemActionProps extends Omit<IconButtonProps, "icon"> {
    element?: React.ReactNode;
}

const SidebarMenuItemAction = ({ element, ...props }: SidebarMenuItemActionProps) => {
    const { expanded } = useSidebar();
    const [showAction, setShowAction] = useState(false);

    useEffect(() => {
        if (expanded) {
            const timer = setTimeout(() => {
                setShowAction(true);
            }, 100);
            return () => clearTimeout(timer);
        }
        setShowAction(false);
        return undefined;
    }, [expanded]);

    if (!showAction) {
        return null;
    }

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
