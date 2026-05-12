import React, { useEffect, useMemo, useState } from "react";
import { Tabs } from "radix-ui";
import { cn } from "~/utils.js";
import { SegmentedControlPrimitive } from "./primitives/index.js";
import type { SegmentedControlPrimitiveProps } from "./primitives/index.js";
import {
    SegmentedControlTabsContext,
    type SegmentedTabItem
} from "./SegmentedControlTabsContext.js";

export interface SegmentedControlTabsProps {
    children: React.ReactNode;
    variant?: SegmentedControlPrimitiveProps["variant"];
    defaultValue?: string;
    className?: string;
    headerClassName?: string;
}

export const SegmentedControlTabs = ({
    children,
    variant,
    defaultValue,
    className,
    headerClassName
}: SegmentedControlTabsProps) => {
    const [tabs, setTabs] = useState<SegmentedTabItem[]>([]);
    const [activeTab, setActiveTab] = useState(defaultValue ?? "");

    useEffect(() => {
        if (!activeTab && tabs.length > 0) {
            setActiveTab(tabs[0].value);
        }
    }, [tabs]);

    const items = useMemo(
        () =>
            tabs
                .filter(tab => tab.visible !== false)
                .map(tab => ({
                    value: tab.value,
                    label: tab.trigger,
                    icon: tab.icon,
                    disabled: tab.disabled
                })),
        [tabs]
    );

    const context = useMemo(
        () => ({
            activeTab,
            setActiveTab,
            addTab(tab: SegmentedTabItem) {
                setTabs(prev => {
                    const idx = prev.findIndex(t => t.value === tab.value);
                    if (idx > -1) {
                        return [...prev.slice(0, idx), tab, ...prev.slice(idx + 1)];
                    }
                    return [...prev, tab];
                });
            },
            removeTab(id: string) {
                setTabs(prev => prev.filter(t => t.id !== id));
            }
        }),
        [activeTab, setActiveTab]
    );

    return (
        <SegmentedControlTabsContext.Provider value={context}>
            <Tabs.Root value={activeTab} onValueChange={setActiveTab} className={className}>
                <div className={headerClassName}>
                    <SegmentedControlPrimitive
                        items={items}
                        value={activeTab}
                        onChange={setActiveTab}
                        variant={variant}
                        fullWidth
                    />
                </div>
                {tabs.map(tab => (
                    <Tabs.Content
                        key={tab.id}
                        value={tab.value}
                        forceMount
                        className={cn("focus-visible:outline-none", "data-[state=inactive]:hidden")}
                    >
                        {tab.content}
                    </Tabs.Content>
                ))}
                {children}
            </Tabs.Root>
        </SegmentedControlTabsContext.Provider>
    );
};
