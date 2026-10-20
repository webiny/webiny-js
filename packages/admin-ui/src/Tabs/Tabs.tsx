import React, { useMemo, useState } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cn, makeDecoratable, type VariantProps, withStaticProps } from "~/utils.js";
import type { ITabsContext, TabItem, TabProps } from "./components/index.js";
import { Content, List, Tab, TabsContext, Trigger, tabListVariants } from "./components/index.js";

const Root = TabsPrimitive.Root;

interface TabsProps extends Omit<TabsPrimitive.TabsProps, "children"> {
    tabs: React.ReactElement<TabProps>[];
    size?: VariantProps<typeof tabListVariants>["size"];
    spacing?: VariantProps<typeof tabListVariants>["spacing"];
    separator?: VariantProps<typeof tabListVariants>["separator"];
    loading?: boolean;
    /**
     * Controls rendered at the end of the tab row, e.g. a filter checkbox or a button.
     */
    actions?: React.ReactNode;
}

const DecoratableTabs = ({
    defaultValue: initialValue,
    size,
    spacing,
    separator,
    loading,
    actions,
    tabs: tabComponents,
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

    const triggers = useMemo(() => {
        const triggerList = tabs.map(tab => (
            <Trigger
                data-testid={tab["data-testid"]}
                disabled={tab.disabled}
                icon={tab.icon}
                key={tab.id}
                loading={loading}
                size={size}
                text={tab.trigger}
                value={tab.value}
                visible={tab.visible}
            />
        ));
        const listKey = tabs.map(tab => tab.id).join(";");

        if (!actions) {
            return (
                <List key={listKey} size={size} spacing={spacing} separator={separator}>
                    {triggerList}
                </List>
            );
        }

        // Actions sit outside the tablist, so arrow keys only move between tabs.
        return (
            <div className={cn(tabListVariants({ size, spacing, separator }))}>
                <List key={listKey} size={size} className={"w-auto"}>
                    {triggerList}
                </List>
                <div className={"ml-auto flex items-center gap-sm"}>{actions}</div>
            </div>
        );
    }, [tabs, size, spacing, separator, loading, actions]);

    const contents = useMemo(
        () =>
            tabs.map(tab => (
                <Content
                    key={tab.id}
                    value={tab.value}
                    content={tab.content}
                    spacing={tab.spacing ?? spacing}
                    className={tab.className}
                />
            )),
        [tabs, spacing]
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

    return (
        <Root {...props} defaultValue={defaultValue}>
            {triggers}
            {contents}
            <TabsContext.Provider value={context}>{tabComponents}</TabsContext.Provider>
        </Root>
    );
};

const BaseTabs = makeDecoratable("Tabs", DecoratableTabs);

const Tabs = withStaticProps(BaseTabs, {
    Tab
});

export { Tabs, type TabsProps };
