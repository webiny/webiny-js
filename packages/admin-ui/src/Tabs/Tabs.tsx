import React, { useEffect, useMemo, useState } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { makeDecoratable, type VariantProps, withStaticProps } from "~/utils.js";
import type { ITabsContext, TabItem, TabProps, tabListVariants } from "./components/index.js";
import {
    Content,
    List,
    Tab,
    TabsContext,
    Trigger,
    SegmentedTabsContext
} from "./components/index.js";
import { SegmentedControl } from "~/SegmentedControl/index.js";
import type { SegmentedControlPrimitiveProps } from "~/SegmentedControl/index.js";

const Root = TabsPrimitive.Root;

interface TabsProps extends Omit<TabsPrimitive.TabsProps, "children"> {
    tabs: React.ReactElement<TabProps>[];
    size?: VariantProps<typeof tabListVariants>["size"];
    spacing?: VariantProps<typeof tabListVariants>["spacing"];
    separator?: VariantProps<typeof tabListVariants>["separator"];
    /**
     * "segmented" replaces the tab trigger list with a SegmentedControl.
     */
    variant?: "default" | "segmented";
    /**
     * Visual variant forwarded to SegmentedControl when variant="segmented".
     */
    segmentedVariant?: SegmentedControlPrimitiveProps["variant"];
    /**
     * Extra className applied to the SegmentedControl wrapper when variant="segmented".
     */
    segmentedHeaderClassName?: string;
    /**
     * Extra className applied to each tab content panel when variant="segmented".
     */
    contentClassName?: string;
}

const DecoratableTabs = ({
    defaultValue: initialValue,
    size,
    spacing,
    separator,
    tabs: tabComponents,
    variant = "default",
    segmentedVariant,
    segmentedHeaderClassName,
    contentClassName,
    ...props
}: TabsProps) => {
    const [tabs, setTabs] = useState<TabItem[]>([]);

    const defaultValue = useMemo(() => {
        return (
            initialValue ||
            tabComponents.find(tab => !tab.props.disabled && tab.props.visible !== false)?.props
                .value
        );
    }, [initialValue, tabComponents]);

    const [activeValue, setActiveValue] = useState(
        () =>
            initialValue ||
            tabComponents.find(tab => !tab.props.disabled && tab.props.visible !== false)?.props
                .value ||
            ""
    );

    // Fallback: auto-select first tab when no defaultValue was provided and tabs register.
    useEffect(() => {
        if (variant === "segmented" && !activeValue && tabs.length > 0) {
            setActiveValue(tabs[0].value);
        }
    }, [tabs]);

    const segmentedItems = useMemo(
        () =>
            tabs
                .filter(tab => tab.visible !== false)
                .map(tab => ({ value: tab.value, label: tab.trigger, icon: tab.icon })),
        [tabs]
    );

    const triggers = useMemo(() => {
        if (variant === "segmented") {
            return (
                <div className={segmentedHeaderClassName}>
                    <SegmentedControl
                        items={segmentedItems}
                        value={activeValue}
                        onChange={setActiveValue}
                        variant={segmentedVariant}
                        fullWidth
                    />
                </div>
            );
        }

        return (
            <List
                key={tabs.map(tab => tab.id).join(";")}
                size={size}
                spacing={spacing}
                separator={separator}
            >
                {tabs.map(tab => (
                    <Trigger
                        data-testid={tab["data-testid"]}
                        disabled={tab.disabled}
                        icon={tab.icon}
                        key={tab.id}
                        size={size}
                        text={tab.trigger}
                        value={tab.value}
                        visible={tab.visible}
                    />
                ))}
            </List>
        );
    }, [
        tabs,
        variant,
        activeValue,
        segmentedItems,
        segmentedHeaderClassName,
        segmentedVariant,
        size,
        spacing,
        separator
    ]);

    const contents = useMemo(
        () =>
            tabs.map(tab => (
                <Content
                    key={tab.id}
                    value={tab.value}
                    content={tab.content}
                    spacing={variant === "segmented" ? undefined : (tab.spacing ?? spacing)}
                    className={
                        contentClassName ??
                        (variant === "segmented"
                            ? "flex-1 min-h-0 !bg-transparent !rounded-none"
                            : undefined)
                    }
                />
            )),
        [tabs, spacing, variant, contentClassName]
    );

    const context: ITabsContext = useMemo(
        () => ({
            addTab(props) {
                setTabs(tabs => {
                    const existingIndex = tabs.findIndex(tab => tab.value === props.value);
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
                setTabs(tabs => tabs.filter(tab => tab.id !== id));
            }
        }),
        [setTabs]
    );

    const rootProps =
        variant === "segmented"
            ? { ...props, value: activeValue, onValueChange: setActiveValue }
            : { ...props, defaultValue };

    const inner = (
        <Root {...rootProps}>
            {triggers}
            {contents}
            <TabsContext.Provider value={context}>{tabComponents}</TabsContext.Provider>
        </Root>
    );

    if (variant === "segmented") {
        return (
            <SegmentedTabsContext.Provider
                value={{ activeTab: activeValue, setActiveTab: setActiveValue }}
            >
                {inner}
            </SegmentedTabsContext.Provider>
        );
    }

    return inner;
};

const BaseTabs = makeDecoratable("Tabs", DecoratableTabs);

const Tabs = withStaticProps(BaseTabs, {
    Tab
});

export { Tabs, type TabsProps };
