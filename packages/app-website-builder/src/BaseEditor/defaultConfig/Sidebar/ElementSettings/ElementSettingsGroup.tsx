import React from "react";
import { Sidebar } from "~/BaseEditor/config/Sidebar/Sidebar.js";
import { ScrollableContainer } from "~/BaseEditor/config/Sidebar/ScrollableContainer.js";
import { useSidebarTabs } from "~/BaseEditor/config/Sidebar/SidebarTabsContext.js";

export const ElementSettingsGroup = () => {
    const { activeTab } = useSidebarTabs();
    if (activeTab !== "element") {
        return null;
    }
    return (
        <ScrollableContainer tabIndex={-1}>
            <Sidebar.Elements group={"element"} />
        </ScrollableContainer>
    );
};
