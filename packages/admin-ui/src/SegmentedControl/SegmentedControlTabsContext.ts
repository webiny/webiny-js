import { createContext, useContext } from "react";
import type React from "react";

export interface SegmentedTabItem {
    id: string;
    value: string;
    trigger: React.ReactNode;
    icon?: React.ReactElement;
    content: React.ReactNode;
    disabled?: boolean;
    visible?: boolean;
}

interface SegmentedControlTabsContextValue {
    addTab: (tab: SegmentedTabItem) => void;
    removeTab: (id: string) => void;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const SegmentedControlTabsContext = createContext<SegmentedControlTabsContextValue>({
    addTab: () => undefined,
    removeTab: () => undefined,
    activeTab: "",
    setActiveTab: () => undefined
});

export const useSegmentedTabs = () => useContext(SegmentedControlTabsContext);
