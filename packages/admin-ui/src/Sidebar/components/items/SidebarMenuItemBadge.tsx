import React from "react";

interface SidebarMenuItemBadgeProps {
    text: React.ReactNode;
}

const SidebarMenuItemBadge = ({ text }: SidebarMenuItemBadgeProps) => {
    return (
        <span
            className={
                "inline-flex items-center rounded-sm bg-primary/50 px-xs text-[10px] font-semibold text-neutral-light leading-none h-md shrink-0"
            }
        >
            {text}
        </span>
    );
};

export { SidebarMenuItemBadge, type SidebarMenuItemBadgeProps };
