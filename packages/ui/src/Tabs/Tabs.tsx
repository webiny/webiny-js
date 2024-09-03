import React, { createContext, PropsWithChildren, useCallback, useMemo, useState } from "react";
import { Tabs as TabsBase, TabsTrigger, TabsContent } from "@webiny/admin-ui";
import { TabProps } from "./Tab";

const VALUE_PREFIX = "tab-";

export type TabsProps = PropsWithChildren<{
    /**
     * Append a class name.
     */
    className?: string;

    /**
     * Callback to execute when a tab is changed.
     */
    onActivate?: (index: number) => void;

    /**
     * Active tab index value.
     */
    value?: number;

    /**
     * Tab ID for the testing.
     */
    "data-testid"?: string;
}>;

interface TabItem extends TabProps {
    id: string;
}

interface TabsContext {
    addTab(props: TabItem): void;
    removeTab(id: string): void;
}

export const TabsContext = createContext<TabsContext | undefined>(undefined);

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Tabs` component from the `@webiny/admin-ui` package instead.
 */
export const Tabs = ({ value, onActivate, ...props }: TabsProps) => {
    const [activeTabIndex, setActiveIndex] = useState(0);
    const [tabs, setTabs] = useState<TabItem[]>([]);

    const activeIndex = value !== undefined ? value : activeTabIndex;

    const onValueChange = useCallback(
        (value: string) => {
            const parts = value.split(VALUE_PREFIX);
            const index = parseInt(parts[1]);

            if (isNaN(index)) {
                return;
            }

            setActiveIndex(index);
            onActivate && onActivate(index);
        },
        [onActivate]
    );

    /* We need to generate a key like this to trigger a proper component re-render when child tabs change. */
    const triggers = tabs
        .filter(item => item.visible)
        .map((item, index) => {
            return (
                <TabsTrigger
                    key={`${VALUE_PREFIX}${index}`}
                    data-testid={item["data-testid"]}
                    value={`${VALUE_PREFIX}${index}`}
                    disabled={item.disabled}
                    text={item.label}
                    icon={item.icon}
                />
            );
        });

    const contents = tabs.filter(Boolean).map((tab, index) => {
        return (
            <TabsContent
                key={`${VALUE_PREFIX}${index}`}
                value={`${VALUE_PREFIX}${index}`}
                text={tab.children}
            />
        );
    });

    const context: TabsContext = useMemo(
        () => ({
            addTab(props) {
                setTabs(tabs => {
                    const existingIndex = tabs.findIndex(tab => tab.id === props.id);
                    if (existingIndex > -1) {
                        return [
                            ...tabs.slice(0, existingIndex),
                            props,
                            ...tabs.slice(existingIndex + 1)
                        ];
                    }
                    return [...tabs, props];
                });
            },
            removeTab(id) {
                setTabs(tabs => tabs.filter(tab => tab.id === id));
            }
        }),
        [setTabs]
    );

    return (
        <>
            <TabsBase
                {...props}
                defaultValue={`${VALUE_PREFIX}${activeIndex}`}
                onValueChange={onValueChange}
                triggers={triggers}
                contents={contents}
            />
            <TabsContext.Provider value={context}>{props.children}</TabsContext.Provider>
        </>
    );
};

Tabs.displayName = "Tabs";
