import { createContext, useContext } from "react";

interface SidebarTabsContextValue {
    activeTab: string;
}

export const SidebarTabsContext = createContext<SidebarTabsContextValue>({ activeTab: "element" });
export const useSidebarTabs = () => useContext(SidebarTabsContext);
