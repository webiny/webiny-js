// @flow
import * as React from "react";

import { TabBar, Tab as RmwcTab } from "@rmwc/tabs";

type Props = {
    // Any element that needs to be highlighted.
    children?: React.Node
};

type State = {
    activeTabIndex: number
};

const Tab = () => {};

/**
 * Use Tabs component to display a list of choices, once the handler is triggered.
 */
class Tabs extends React.Component<Props, State> {
    state = {
        activeTabIndex: 0
    };

    render() {
        const tabs = React.Children.map(this.props.children, child => {
            return {
                label: child.props.label,
                children: child.props.children,
                icon: child.props.icon
            };
        });

        const content = (
            <TabBar
                activeTabIndex={this.state.activeTabIndex}
                onActivate={evt => this.setState({ activeTabIndex: evt.detail.index })}
            >
                {tabs.map(item => {
                    return (
                        <RmwcTab
                            tag={"div"}
                            key={item.label}
                            {...(item.icon ? { icon: item.icon } : {})}
                            {...(item.label ? { label: item.label } : {})}
                        />
                    );
                })}
            </TabBar>
        );

        return (
            <React.Fragment>
                {content}
                {tabs[this.state.activeTabIndex].children}
            </React.Fragment>
        );
    }
}

export { Tabs, Tab };
