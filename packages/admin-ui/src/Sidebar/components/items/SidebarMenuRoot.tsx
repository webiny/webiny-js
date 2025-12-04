import React from "react";
import { SidebarMenuProvider } from "./SidebarMenuProvider.js";
import { SidebarMenuPinnedItems } from "./SidebarMenuPinnedItems.js";

interface SidebarMenuProps {
    children: React.ReactNode;
}

const SidebarMenuRoot = ({ children, ...props }: SidebarMenuProps) => (
    <SidebarMenuProvider>
        <ul data-sidebar="menu" className={"flex w-full min-w-0 flex-col gap-y-xs"} {...props}>
            <SidebarMenuPinnedItems/>
            {children}
        </ul>
    </SidebarMenuProvider>
);

export { SidebarMenuRoot, type SidebarMenuProps };
