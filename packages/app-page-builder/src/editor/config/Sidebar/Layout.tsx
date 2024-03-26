import React from "react";
import { css } from "emotion";
import { makeDecoratable } from "@webiny/app-admin";
import { Elevation } from "@webiny/ui/Elevation";
import { Tabs } from "@webiny/ui/Tabs";
import { Sidebar } from "./Sidebar";
import { SidebarHighlight } from "./SidebarHighlight";

const rightSideBar = css({
    boxShadow: "1px 0px 5px 0px rgba(128,128,128,1)",
    position: "fixed",
    right: 0,
    top: 65,
    height: "100%",
    width: 300,
    zIndex: 1
});

export interface LayoutProps {
    className?: string;
}

export const Layout = makeDecoratable(
    "SidebarLayout",
    ({ className = rightSideBar }: LayoutProps) => {
        const { activeGroup, setActiveGroup } = Sidebar.useActiveGroup();

        return (
            <Elevation z={1} className={className}>
                <Tabs value={activeGroup} onActivate={setActiveGroup}>
                    <Sidebar.Elements group="groups" />
                </Tabs>
                <SidebarHighlight />
            </Elevation>
        );
    }
);
