import React from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { SegmentedControl } from "@webiny/admin-ui";
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
            <SegmentedControl.Tabs className={"flex-1 flex flex-col min-h-0"} variant={"dimmed"}>
                <Sidebar.Elements group={"groups"} />
            </SegmentedControl.Tabs>
        </div>
    );
});
