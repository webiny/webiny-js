import React from "react";
import { cn } from "~/utils.js";

interface SidebarMenuItemBadgeProps {
    text: React.ReactNode;
}

const SidebarMenuItemBadge = ({ text }: SidebarMenuItemBadgeProps) => {
    return (
        <span
            className={
                "inline-flex items-center rounded-sm bg-primary px-xs text-[10px] font-semibold text-neutral-light leading-none h-[16px] shrink-0"
            }
        >
            {text}
        </span>
    );
};

export { SidebarMenuItemBadge, type SidebarMenuItemBadgeProps };
