import React, { ReactNode } from "react";
import classNames from "classnames";
import { TabBar } from "@rmwc/tabs";
import { Tab, TabProps } from "./Tab";

export interface TabsRenderProps {
    switchTab(tabIndex: number): void;
}

export interface TabsPropsChildrenCallable {
    (props: TabsRenderProps): ReactNode;
}
type TabsPropsChildren = TabsPropsChildrenCallable | ReactNode;
export interface TabsProps {
    /**
     * A collection of tabs that needs to be rendered.
     */
    children: TabsPropsChildren;

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
}

interface State {
    activeTabIndex: number;
}

const disabledStyles: Record<string, string | number> = {
    opacity: 0.5,
    pointerEvents: "none"
};

const getTabsChildren = (children: React.ReactNode): TabProps[] => {
    const filteredTabs = React.Children.toArray(children).filter(
        c => c !== null
        /**
         * TODO @ts-refactor
         * Need to cast because TS is complaining due to differences between types that can be in ReactNode
         */
    ) as React.ReactElement<TabProps>[];

    return filteredTabs.map(child => {
        return {
            label: child.props.label,
            children: child.props.children,
            icon: child.props.icon,
            disabled: child.props.disabled,
            style: child.props.style,
            "data-testid": child.props["data-testid"]
        };
    });
};

/**
 * Use Tabs component to display a list of choices, once the handler is triggered.
 */
export class Tabs extends React.Component<TabsProps, State> {
    state: State = {
        activeTabIndex: 0
    };

    public switchTab(activeTabIndex: number): void {
        if (typeof this.props.updateValue === "function") {
            this.props.updateValue(activeTabIndex);
            return;
        }
        this.setState({ activeTabIndex });
    }

    public renderChildren(children: React.ReactNode, activeIndex: number) {
        const tabs = getTabsChildren(children);

        const tabBar = (
            <TabBar
                className="webiny-ui-tabs__tab-bar"
                activeTabIndex={activeIndex}
                onActivate={evt => {
                    if (typeof this.props.updateValue === "function") {
                        this.props.updateValue(evt.detail.index);
                    } else {
                        this.setState({ activeTabIndex: evt.detail.index });
                    }
                    this.props.onActivate && this.props.onActivate(evt.detail.index);
                }}
            >
                {tabs.map((item: TabProps, index) => {
                    const style = item.style || {};
                    if (item.disabled) {
                        Object.assign(style, disabledStyles);
                    }

                    return (
                        <Tab
                            tag={"div"}
                            style={style}
                            key={item.label + "-" + index}
                            data-testid={item["data-testid"]}
                            {...(item.icon ? { icon: item.icon } : {})}
                            {...(item.label ? { label: item.label } : {})}
                        />
                    );
                })}
            </TabBar>
        );

        const content = [];
        for (let i = 0; i < tabs.length; i++) {
            const current = tabs[i];
            if (activeIndex === i) {
                content.push(<div key={i}>{current.children}</div>);
            } else {
                content.push(
                    <div key={i} style={{ display: "none" }}>
                        {current.children}
                    </div>
                );
            }
        }

        return (
            <div className={classNames("webiny-ui-tabs", this.props.className)}>
                {tabBar}
                <div className={"webiny-ui-tabs__content mdc-tab-content"}>{content}</div>
            </div>
        );
    }

    public render() {
        const activeIndex =
            this.props.value !== undefined ? this.props.value : this.state.activeTabIndex;

        let children = this.props.children;
        if (typeof this.props.children === "function") {
            const childrenCallable = this.props.children as TabsPropsChildrenCallable;
            children = childrenCallable({ switchTab: this.switchTab.bind(this) });
        }

        return this.renderChildren(children, activeIndex);
    }
}
