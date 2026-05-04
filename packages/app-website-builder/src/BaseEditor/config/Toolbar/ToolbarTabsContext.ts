import { createContext, useContext } from "react";

interface ToolbarTabsContextValue {
    activeTab: string;
}

export const ToolbarTabsContext = createContext<ToolbarTabsContextValue>({ activeTab: "insert" });
export const useToolbarTabs = () => useContext(ToolbarTabsContext);
