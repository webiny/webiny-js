import type { PropsWithChildren } from "react";
import React, { createContext, useCallback, useMemo, useState } from "react";
import { Tabs as AdminTabs } from "@webiny/admin-ui";
import type { TabProps } from "./Tab";

const VALUE_PREFIX = "tab-";

export type TabsProps = PropsWithChildren<{
    /**
     * Append an ID.
     */
    id?: string;

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

interface DeprecatedTabsContext {
    addTab(props: TabItem): void;

    removeTab(id: string): void;
}

export const DeprecatedTabsContext = createContext<DeprecatedTabsContext | undefined>(undefined);

/**
 * @deprecated This component is deprecated and will be removed in future releases.
 * Please use the `Tabs` component from the `@webiny/admin-ui` package instead.
 */
export const Tabs = ({ value, onActivate, ...props }: TabsProps) => {
    const [activeTabIndex, setActiveIndex] = useState(0);
    const [tabs, setTabs] = useState<TabItem[]>([]);

    const activeIndex = value !== undefined ? value : activeTabIndex;

    const onValueChange = useCallback(
        (value: string): void => {
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
    const newTabs = tabs.map((tab, index) => {
        return (
            <AdminTabs.Tab
                key={`${VALUE_PREFIX}${index}`}
                value={`${VALUE_PREFIX}${index}`}
                trigger={tab.label}
                content={tab.children}
                icon={tab.icon}
                disabled={tab.disabled}
                visible={tab.visible !== false}
                data-testid={tab["data-testid"]}
            />
        );
    });

    const context: DeprecatedTabsContext = useMemo(
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
            <AdminTabs
                {...props}
                value={`${VALUE_PREFIX}${activeIndex}`}
                onValueChange={onValueChange}
                tabs={newTabs}
                size={"md"}
                separator={true}
                spacing={"lg"}
            />
            <DeprecatedTabsContext.Provider value={context}>
                {props.children}
            </DeprecatedTabsContext.Provider>
        </>
    );
};

Tabs.displayName = "Tabs";
