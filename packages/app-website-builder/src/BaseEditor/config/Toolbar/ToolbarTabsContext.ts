import { createContext, useContext } from "react";

interface ToolbarTabsContextValue {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const ToolbarTabsContext = createContext<ToolbarTabsContextValue>({
    activeTab: "insert",
    setActiveTab: () => undefined
});
export const useToolbarTabs = () => useContext(ToolbarTabsContext);
