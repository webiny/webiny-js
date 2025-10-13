import React from "react";
import { SidebarHeader } from "~/admin/components/ContentEntries/SidebarHeader/index.js";
import { SidebarContent } from "~/admin/components/ContentEntries/SidebarContent/index.js";
import { SidebarFooter } from "~/admin/components/ContentEntries/SidebarFooter/SidebarFooter.js";

export const Sidebar = () => {
    return (
        <div className={"flex flex-col h-main-content"}>
            <SidebarHeader />
            <SidebarContent />
            <SidebarFooter />
        </div>
    );
};
