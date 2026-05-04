import React from "react";
import { ScrollArea } from "@webiny/admin-ui";
import { useToolbarTabs } from "~/BaseEditor/config/Toolbar/ToolbarTabsContext.js";
import { InsertElements } from "./InsertElements.js";

export const InsertElementsTab = () => {
    const { activeTab } = useToolbarTabs();
    if (activeTab !== "insert") {
        return null;
    }
    return (
        <ScrollArea className={"h-full"}>
            <InsertElements />
        </ScrollArea>
    );
};
