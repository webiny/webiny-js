import React, {
    createContext,
    forwardRef,
    PropsWithChildren,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState
} from "react";
import classNames from "classnames";
import { TabBar, Tab as RmwcTab } from "@rmwc/tabs";
import { TabProps } from "./Tab";

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
     * Function to change active tab.
     */
    updateValue?: (index: number) => void;
    /**
     * Tab ID for the testing.
     */
    "data-testid"?: string;
}>;

const disabledStyles: Record<string, string | number> = {
    opacity: 0.5,
    pointerEvents: "none"
};

interface TabItem extends TabProps {
    id: string;
}

interface TabsContext {
    addTab(props: TabItem): void;
    removeTab(id: string): void;
}

export const TabsContext = createContext<TabsContext | undefined>(undefined);

export interface TabsImperativeApi {
    switchTab(index: number): void;
}
/**
 * Use Tabs component to display a list of choices, once the handler is triggered.
 */
export const Tabs = forwardRef<TabsImperativeApi | undefined, TabsProps>((props, ref) => {
    const [activeTabIndex, setActiveIndex] = useState(0);
    const [tabs, setTabs] = useState<TabItem[]>([]);

    const activeIndex = props.value !== undefined ? props.value : activeTabIndex;

    const activateTabIndex = useCallback((index: number) => {
        if (typeof props.updateValue === "function") {
            props.updateValue(index);
            return;
        }

        setActiveIndex(index);
    }, []);

    useImperativeHandle(ref, () => ({
        switchTab(tabIndex: number) {
            activateTabIndex(tabIndex);
        }
    }));

    /**
     * This effect will make sure that disabled tabs automatically switch to the first tab.
     */
    useEffect(() => {
        if (tabs[activeIndex]?.disabled) {
            activateTabIndex(0);
        }
    });

    /* We need to generate a key like this to trigger a proper component re-render when child tabs change. */
    const tabBar = (
        <TabBar
            key={tabs.map(tab => tab.id).join(";")}
            className="webiny-ui-tabs__tab-bar"
            activeTabIndex={activeIndex}
            onActivate={evt => {
                if (typeof props.updateValue === "function") {
                    props.updateValue(evt.detail.index);
                } else {
                    setActiveIndex(evt.detail.index);
                }
                props.onActivate && props.onActivate(evt.detail.index);
            }}
        >
            {tabs.map(item => {
                const style = item.style || {};
                if (item.disabled) {
                    Object.assign(style, disabledStyles);
                }

                return (
                    <RmwcTab
                        tag={"div"}
                        style={style}
                        key={item.id}
                        data-testid={item["data-testid"]}
                        {...(item.icon ? { icon: item.icon } : {})}
                    >
                        {item.label}
                    </RmwcTab>
                );
            })}
        </TabBar>
    );

    const content = tabs.map((tab, index) => {
        if (activeIndex === index) {
            return <div key={index}>{tab.children}</div>;
        } else {
            return (
                <div key={index} style={{ display: "none" }}>
                    {tab.children}
                </div>
            );
        }
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
        <div className={classNames("webiny-ui-tabs", props.className)}>
            {tabBar}
            <div className={"webiny-ui-tabs__content mdc-tab-content"}>{content}</div>
            <TabsContext.Provider value={context}>{props.children}</TabsContext.Provider>
        </div>
    );
});

Tabs.displayName = "Tabs";
