// @flow
import * as React from "react";
import classNames from "classnames";

import { TabBar, Tab as RmwcTab } from "@rmwc/tabs";

type Props = {
    // Any element that needs to be highlighted.
    children?: React.Node,

    // Append a class name
    className?: string
};

type State = {
    activeTabIndex: number
};

const Tab = () => {};

const disabledStyles = {
    opacity: 0.5,
    pointerEvents: "none"
};

/**
 * Use Tabs component to display a list of choices, once the handler is triggered.
 */
class Tabs extends React.Component<Props, State> {
    state = {
        activeTabIndex: 0
    };

    switchTab(activeTabIndex) {
        this.setState({ activeTabIndex });
    }

    render() {
        const tabs = React.Children.toArray(this.props.children)
            .filter(c => c !== null)
            .map(child => {
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
                onActivate={evt => this.setState({ activeTabIndex: evt.detail.index })}
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
            let current = tabs[i];
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
}

export { Tabs, Tab };
