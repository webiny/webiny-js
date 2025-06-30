import React, { useMemo, useState } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { makeDecoratable, type VariantProps, withStaticProps } from "~/utils";
import {
    Content,
    ITabsContext,
    List,
    Tab,
    TabItem,
    TabProps,
    TabsContext,
    Trigger,
    tabListVariants
} from "./components";

const Root = TabsPrimitive.Root;

interface TabsProps extends Omit<TabsPrimitive.TabsProps, "children"> {
    tabs: React.ReactElement<TabProps>[];
    size?: VariantProps<typeof tabListVariants>["size"];
    spacing?: VariantProps<typeof tabListVariants>["spacing"];
    separator?: VariantProps<typeof tabListVariants>["separator"];
}

const DecoratableTabs = ({
    defaultValue: initialValue,
    size,
    spacing,
    separator,
    tabs: tabComponents,
    ...props
}: TabsProps) => {
    const [tabs, setTabs] = useState<TabItem[]>([]);

    const defaultValue = useMemo(() => {
        // `defaultValue` prop works only at first render so we need to use the `tabComponents` instead of the `TabItems`
        return (
            initialValue ||
            tabComponents.find(tab => !tab.props.disabled && tab.props.visible !== false)?.props
                .value
        );
    }, [initialValue, tabComponents]);

    const triggers = useMemo(
        () => (
            // We need to generate a key like this to trigger a proper component re-render when child tabs change.
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
        ),
        [tabs, size, spacing]
    );

    const contents = useMemo(
        () =>
            tabs.map(tab => (
                <Content
                    key={tab.id}
                    value={tab.value}
                    content={tab.content}
                    spacing={tab.spacing ?? spacing}
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
                setTabs(tabs => tabs.filter(tab => tab.id === id));
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
