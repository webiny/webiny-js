import React from "react";
import { SidebarMenuProvider } from "./SidebarMenuProvider.js";
import { SidebarMenuPinnedItems } from "./SidebarMenuPinnedItems.js";

interface SidebarMenuProps {
    children: React.ReactNode;
    showPinnedItems?: boolean;
}

const SidebarMenuRoot = ({ children, showPinnedItems = true, ...props }: SidebarMenuProps) => (
    <SidebarMenuProvider>
        <ul data-sidebar="menu" className={"flex w-full min-w-0 flex-col gap-y-xs"} {...props}>
            {showPinnedItems && <SidebarMenuPinnedItems/>}
            {children}
        </ul>
    </SidebarMenuProvider>
);

export { SidebarMenuRoot, type SidebarMenuProps };
