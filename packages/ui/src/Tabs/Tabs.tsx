import React, { ReactNode } from "react";
import classNames from "classnames";
import { TabBar } from "@rmwc/tabs";
import { Tab, TabProps } from "./Tab";

export type TabsRenderProps = {
    switchTab(tabIndex: number): void;
};

export type TabsProps = {
    /**
     * A collection of tabs that needs to be rendered.
     */
    children: ((props: TabsRenderProps) => ReactNode) | ReactNode;

    /**
     * Append a class name.
     */
    className?: string;

    /**
     * Callback to execute when a tab is changed.
     */
    onActivate?: (index: number) => void;
};

type State = {
    activeTabIndex: number;
};

const disabledStyles = {
    opacity: 0.5,
    pointerEvents: "none"
};

/**
 * Use Tabs component to display a list of choices, once the handler is triggered.
 */
export class Tabs extends React.Component<TabsProps, State> {
    state = {
        activeTabIndex: 0
    };

    switchTab(activeTabIndex) {
        this.setState({ activeTabIndex });
    }

    renderChildren(children) {
        const tabs = React.Children.toArray(children)
            .filter(c => c !== null)
            .map((child: React.ReactElement<TabProps>) => {
                return {
                    label: child.props.label,
                    children: child.props.children,
                    icon: child.props.icon,
                    disabled: child.props.disabled,
                    style: child.props.style
                };
            });

        const tabBar = (
            <TabBar
                className="webiny-ui-tabs__tab-bar"
                activeTabIndex={this.state.activeTabIndex}
                onActivate={evt => {
                    this.setState({ activeTabIndex: evt.detail.index });
                    this.props.onActivate && this.props.onActivate(evt.detail.index);
                }}
            >
                {tabs.map((item: TabProps) => {
                    const style = item.style || {};
                    if (item.disabled) {
                        Object.assign(style, disabledStyles);
                    }

                    return (
                        <Tab
                            tag={"div"}
                            style={style}
                            key={item.label}
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
            if (this.state.activeTabIndex === i) {
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

    render() {
        let children = this.props.children;
        if (typeof this.props.children === "function") {
            // @ts-ignore
            children = this.props.children({ switchTab: this.switchTab.bind(this) });
        }

        return this.renderChildren(children);
    }
}
