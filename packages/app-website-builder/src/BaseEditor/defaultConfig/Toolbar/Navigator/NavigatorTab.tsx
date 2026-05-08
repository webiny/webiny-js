import React from "react";
import { useToolbarTabs } from "~/BaseEditor/config/Toolbar/ToolbarTabsContext.js";
import { Navigator } from "./Navigator.js";

export const NavigatorTab = () => {
    const { activeTab } = useToolbarTabs();
    if (activeTab !== "navigator") {
        return null;
    }
    return <Navigator />;
};
