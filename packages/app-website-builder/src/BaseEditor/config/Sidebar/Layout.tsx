import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { SegmentedControl } from "@webiny/admin-ui";
import { PanelHeader } from "../Panels/PanelHeader.js";
import { Sidebar } from "./Sidebar.js";

export const Layout = makeDecoratable("SidebarLayout", () => {
    return (
        <div
            data-role="editor-sidebar"
            data-affects-preview={"width"}
            className={
                "bg-neutral-base border-l-sm border-l-neutral-dimmed h-full flex flex-col p-sm"
            }
        >
            {/* In a panel, the sidebar collapses like any other panel. */}
            <PanelHeader />
            <SegmentedControl.Tabs className={"flex-1 flex flex-col min-h-0"} variant={"dimmed"}>
                <Sidebar.Elements group={"groups"} />
            </SegmentedControl.Tabs>
        </div>
    );
});
