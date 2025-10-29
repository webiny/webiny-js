import React from "react";
import { SidebarMenuProvider } from "./SidebarMenuProvider.js";

interface SidebarMenuProps {
    children: React.ReactNode;
}

const SidebarMenuRoot = (props: SidebarMenuProps) => (
    <SidebarMenuProvider>
        <ul data-sidebar="menu" className={"flex w-full min-w-0 flex-col gap-y-xs"} {...props} />
    </SidebarMenuProvider>
);

export { SidebarMenuRoot, type SidebarMenuProps };
