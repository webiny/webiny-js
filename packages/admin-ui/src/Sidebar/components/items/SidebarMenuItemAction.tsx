import React, { useEffect, useState } from "react";
import { cn } from "~/utils.js";
import { IconButton, type IconButtonProps } from "~/Button/IconButton.js";
import { useSidebar } from "~/Sidebar/index.js";

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
