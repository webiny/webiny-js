import React, { useState } from "react";
import { makeDecoratable } from "@webiny/app-admin";
import { SegmentedControl } from "@webiny/admin-ui";
import { Sidebar } from "./Sidebar.js";
import { SidebarTabsContext } from "./SidebarTabsContext.js";

const TABS = [
    { label: "Element", value: "element" },
    { label: "Style", value: "style" }
];

export const Layout = makeDecoratable("SidebarLayout", () => {
    const [activeTab, setActiveTab] = useState("element");

    return (
        <SidebarTabsContext.Provider value={{ activeTab }}>
            <div
                data-role="editor-sidebar"
                data-affects-preview={"width"}
                className={
                    "bg-neutral-base border-l-sm border-l-neutral-dimmed h-full flex flex-col"
                }
            >
                <div className={"flex-shrink-0 px-sm py-sm border-b-neutral-dimmed"}>
                    <SegmentedControl
                        items={TABS}
                        value={activeTab}
                        onChange={setActiveTab}
                        variant={"dimmed"}
                        fullWidth
                    />
                </div>
                <div className={"flex-1 min-h-0"}>
                    <Sidebar.Elements group={"groups"} />
                </div>
            </div>
        </SidebarTabsContext.Provider>
    );
});
