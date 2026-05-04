import React, { useState } from "react";
import { Icon, SegmentedControl } from "@webiny/admin-ui";
import { ReactComponent as InsertIcon } from "@webiny/icons/add_circle_outline.svg";
import { ReactComponent as TreeIcon } from "@webiny/icons/account_tree.svg";
import { Toolbar } from "./Toolbar.js";
import { ToolbarTabsContext } from "./ToolbarTabsContext.js";

const TABS = [
    {
        label: "Insert",
        value: "insert",
        icon: <Icon icon={<InsertIcon />} label={"Insert Element"} />
    },
    {
        label: "Navigator",
        value: "navigator",
        icon: <Icon icon={<TreeIcon />} label={"Navigator"} />
    }
];

export const Layout = () => {
    const [activeTab, setActiveTab] = useState("insert");

    return (
        <ToolbarTabsContext.Provider value={{ activeTab }}>
            <div
                data-role={"editor-toolbar"}
                className={
                    "bg-neutral-base border-r-sm border-r-neutral-dimmed w-[300px] h-full flex flex-col"
                }
            >
                <div className={"flex-shrink-0 px-sm py-sm border-b-neutral-dimmed"}>
                    <SegmentedControl items={TABS} value={activeTab} onChange={setActiveTab} />
                </div>
                <div className={"flex-1 min-h-0"}>
                    <Toolbar.Elements group={"tabs"} />
                </div>
            </div>
        </ToolbarTabsContext.Provider>
    );
};
