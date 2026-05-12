import { createContext, useContext } from "react";

interface SegmentedTabsContextValue {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const SegmentedTabsContext = createContext<SegmentedTabsContextValue>({
    activeTab: "",
    setActiveTab: () => undefined
});

export const useSegmentedTabs = () => useContext(SegmentedTabsContext);
